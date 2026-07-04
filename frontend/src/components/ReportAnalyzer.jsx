import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  FileUp, ScanLine, X, AlertTriangle, HeartPulse,
  FileText, CheckCircle2, RotateCcw, Download, Loader2
} from 'lucide-react';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 10;

const LOADING_STEPS = [
  'Reading your report...',
  'Extracting text and values...',
  'Analyzing findings...',
  'Preparing plain-language explanation...',
  'Finalizing recommendations...'
];

const RISK_STYLES = {
  normal:   { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', emoji: '🟢', label: 'Normal' },
  mild:     { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', emoji: '🟡', label: 'Mild' },
  moderate: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', emoji: '🟠', label: 'Moderate' },
  critical: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', emoji: '🔴', label: 'Critical' },
};

const SYSTEM_PROMPT = `You are a medical report analysis assistant for a public health awareness app used in India.
Analyze the uploaded medical report (lab report, prescription, scan summary, etc.) and respond with ONLY a valid JSON object (no markdown fences, no extra text) with EXACTLY these keys:

{
  "summary": "string - 2-3 sentence summary of the report",
  "plainExplanation": "string - explain the report in simple, non-technical language a layperson can understand",
  "findings": [{"name": "string", "value": "string", "status": "normal|abnormal|critical", "note": "string"}],
  "bodyChanges": "string - what is happening in the body based on these results",
  "possibleCauses": ["string"],
  "symptoms": ["string - symptoms the person may experience"],
  "lifestyleImprovements": ["string"],
  "foodsToEat": ["string"],
  "foodsToAvoid": ["string"],
  "medicineAnalysis": "string or null - only if medicines/prescriptions are detected in the report",
  "riskLevel": "normal|mild|moderate|critical",
  "doctorRecommendation": "string - whether and when to see a doctor",
  "disclaimer": "string - standard medical disclaimer stating this is not a diagnosis"
}

Be accurate, cautious, and clear. If the document is not a medical report, set riskLevel to "normal" and explain in "summary" that no medical data was found.
Respond with raw JSON only — no markdown code fences, no commentary before or after.`;

export default function ReportAnalyzer({ isDarkMode }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const fileInputRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const validateAndSetFile = useCallback((selectedFile) => {
    setError('');
    if (!selectedFile) return;

    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      setError('Unsupported file type. Please upload a PDF, JPG, PNG, or WEBP file.');
      return;
    }
    if (selectedFile.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${MAX_SIZE_MB}MB.`);
      return;
    }

    setFile(selectedFile);
    setResult(null);

    if (selectedFile.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl(null);
    }
  }, []);

  const handleFileInputChange = (e) => {
    validateAndSetFile(e.target.files?.[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndSetFile(e.dataTransfer.files?.[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Returns a full data URI (e.g. "data:image/png;base64,...."), which is what
  // OpenRouter's OpenAI-compatible content parts expect.
  const fileToDataUri = (f) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(f);
    });
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError('');
    setProgressStep(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const buildContentParts = (dataUri, mimeType) => {
    // Images use the standard "image_url" content part.
    if (mimeType.startsWith('image/')) {
      return [
        { type: 'text', text: SYSTEM_PROMPT },
        { type: 'image_url', image_url: { url: dataUri } },
      ];
    }
    // PDFs use the "file" content part (OpenAI-compatible models on OpenRouter,
    // e.g. Gemini and some GPT-4o variants, support this).
    return [
      { type: 'text', text: SYSTEM_PROMPT },
      {
        type: 'file',
        file: {
          filename: 'report.pdf',
          file_data: dataUri,
        },
      },
    ];
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please upload a report first.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setProgressStep(0);

    progressIntervalRef.current = setInterval(() => {
      setProgressStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 2500);

    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      const model = import.meta.env.VITE_OPENROUTER_VISION_MODEL || import.meta.env.VITE_OPENROUTER_MODEL;

      if (!apiKey) {
        throw new Error('API key not configured. Please contact support.');
      }
      if (!model) {
        throw new Error('No vision-capable model configured.');
      }

      const dataUri = await fileToDataUri(file);
      const contentParts = buildContentParts(dataUri, file.type);

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model,
          messages: [
            {
              role: 'user',
              content: contentParts,
            },
          ],
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'ArogyaBot Report Analyzer',
          },
        }
      );

      const rawText = response?.data?.choices?.[0]?.message?.content;

      if (!rawText) {
        throw new Error('No response received from the analyzer. Please try again.');
      }

      const cleaned = rawText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      setResult(parsed);
    } catch (err) {
      console.error('Report analysis error:', err);
      if (err instanceof SyntaxError) {
        setError('Could not parse the analysis. Please try again.');
      } else if (err.response?.status === 400 && file.type === 'application/pdf') {
        setError('This model does not support PDF input. Try a different file or contact support to switch models.');
      } else if (err.response?.data?.error?.message) {
        setError(err.response.data.error.message);
      } else {
        setError(err.message || 'Something went wrong while analyzing the report.');
      }
    } finally {
      clearInterval(progressIntervalRef.current);
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      const element = document.getElementById('report-analysis-output');
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          clonedDoc.documentElement.classList.remove('dark');
          clonedDoc.body.classList.remove('dark');
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Header on first page
      pdf.setFontSize(18);
      pdf.setTextColor(67, 56, 202);
      pdf.text('ArogyaBot Report Analysis', margin, 18);
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated: ${new Date().toLocaleString('en-IN')}`, margin, 25);

      let heightLeft = imgHeight;
      let position = 32;

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - position);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        'Disclaimer: AI-generated analysis for informational purposes only. Not a substitute for professional medical advice.',
        margin,
        pageHeight - 10
      );

      pdf.save(`ArogyaBot_Report_Analysis_${Date.now()}.pdf`);
    } catch (err) {
      console.error('Error generating report PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="animate-tab-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
          Report Analyzer
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Upload a medical report and get a plain-language breakdown of what it means.
        </p>
      </div>

      {!result && !loading && (
        <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm animate-card-fade-in opacity-0">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
              ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400'}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {!file && (
              <>
                <FileUp className="mx-auto h-10 w-10 text-indigo-500 mb-3" />
                <p className="text-slate-700 dark:text-slate-200 font-semibold">
                  Drag & drop your report here, or click to browse
                </p>
                <p className="text-sm text-slate-400 mt-1">PDF, JPG, PNG, WEBP — up to {MAX_SIZE_MB}MB</p>
              </>
            )}

            {file && (
              <div className="flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Report preview" className="max-h-48 rounded-lg shadow" />
                ) : (
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <FileText className="h-8 w-8 text-indigo-500" />
                    <span className="font-medium">{file.name}</span>
                  </div>
                )}
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 font-medium"
                >
                  <X className="h-4 w-4" /> Remove
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {['Blood Test', 'X-Ray Summary', 'Prescription', 'Ultrasound Report', 'MRI/CT Summary'].map((chip) => (
              <span
                key={chip}
                className="text-xs px-3 py-1 rounded-full bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-medium"
              >
                {chip}
              </span>
            ))}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!file}
            className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3 font-extrabold hover:from-indigo-700 hover:to-indigo-800 transition-all"
          >
            Analyze Report
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl p-10 shadow-sm text-center animate-card-fade-in opacity-0">
          <div className="relative inline-block">
            <HeartPulse className="h-14 w-14 text-indigo-500 animate-pulse mx-auto" />
            <ScanLine className="h-14 w-14 text-indigo-300 absolute top-0 left-0 animate-scan-line" />
          </div>
          <p className="mt-4 font-semibold text-slate-700 dark:text-slate-200">
            {LOADING_STEPS[progressStep]}
          </p>
        </div>
      )}

      {error && !loading && result === null && !file && (
        <div className="bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/40 rounded-2xl p-6 shadow-sm text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" />
          <p className="text-slate-700 dark:text-slate-200 font-medium">{error}</p>
          <button
            onClick={handleReset}
            className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700"
          >
            <RotateCcw className="h-4 w-4" /> Try Again
          </button>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
        <div id="report-analysis-output" className="space-y-4 bg-white dark:bg-slate-900 p-2 rounded-2xl">
          <ResultSection icon="🧾" title="Report Summary" delay={0}>
            <p className="text-slate-600 dark:text-slate-300">{result.summary}</p>
          </ResultSection>

          <ResultSection icon="📖" title="Normal Language Explanation" delay={50}>
            <p className="text-slate-600 dark:text-slate-300">{result.plainExplanation}</p>
          </ResultSection>

          {Array.isArray(result.findings) && result.findings.length > 0 && (
            <ResultSection icon="⚠️" title="Important Findings" delay={100}>
              <div className="space-y-2">
                {result.findings.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">{f.name}</p>
                      {f.note && <p className="text-sm text-slate-500 dark:text-slate-400">{f.note}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-700 dark:text-slate-200">{f.value}</p>
                      <StatusBadge status={f.status} />
                    </div>
                  </div>
                ))}
              </div>
            </ResultSection>
          )}

          <ResultSection icon="🫀" title="Body Changes" delay={150}>
            <p className="text-slate-600 dark:text-slate-300">{result.bodyChanges}</p>
          </ResultSection>

          <ListSection icon="🔬" title="Possible Causes" items={result.possibleCauses} delay={200} />
          <ListSection icon="😓" title="Symptoms You May Experience" items={result.symptoms} delay={250} />
          <ListSection icon="🥦" title="Lifestyle Improvements" items={result.lifestyleImprovements} delay={300} />
          <ListSection icon="✅" title="Foods to Eat" items={result.foodsToEat} delay={350} />
          <ListSection icon="❌" title="Foods to Avoid" items={result.foodsToAvoid} delay={400} />

          {result.medicineAnalysis && (
            <ResultSection icon="💊" title="Medicine Analysis" delay={450}>
              <p className="text-slate-600 dark:text-slate-300">{result.medicineAnalysis}</p>
            </ResultSection>
          )}

          {result.riskLevel && RISK_STYLES[result.riskLevel] && (
            <div className={`rounded-2xl p-6 shadow-sm ${RISK_STYLES[result.riskLevel].bg} animate-card-fade-in opacity-0`}>
              <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                🚦 Risk Level
              </h3>
              <p className={`mt-2 text-xl font-extrabold ${RISK_STYLES[result.riskLevel].color}`}>
                {RISK_STYLES[result.riskLevel].emoji} {RISK_STYLES[result.riskLevel].label}
              </p>
            </div>
          )}

          <ResultSection icon="👨‍⚕️" title="Doctor Recommendation" delay={500}>
            <p className="text-slate-600 dark:text-slate-300">{result.doctorRecommendation}</p>
          </ResultSection>

          <ResultSection icon="⚠️" title="Disclaimer" delay={550}>
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">{result.disclaimer}</p>
          </ResultSection>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl py-3 font-extrabold transition-all"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Preparing PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> Download PDF Report
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl py-3 font-extrabold hover:from-indigo-700 hover:to-indigo-800 transition-all"
          >
            <RotateCcw className="h-4 w-4" /> Analyze Another Report
          </button>
        </div>
        </div>
      )}
    </div>
  );
}

function ResultSection({ icon, title, children, delay = 0 }) {
  return (
    <div
      className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm animate-card-fade-in opacity-0"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function ListSection({ icon, title, items, delay = 0 }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <ResultSection icon={icon} title={title} delay={delay}>
      <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </ResultSection>
  );
}

function StatusBadge({ status }) {
  const styles = {
    normal: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    abnormal: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1 ${styles[status] || styles.normal}`}>
      <CheckCircle2 className="h-3 w-3" /> {status}
    </span>
  );
}
