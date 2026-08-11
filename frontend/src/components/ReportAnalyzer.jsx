import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  FileUp, ScanLine, X, AlertTriangle, HeartPulse,
  FileText, CheckCircle2, RotateCcw, Download, Loader2,
  Sparkles, ShieldCheck, Activity, Copy, Check,
  Info, Stethoscope, Search, HelpCircle, ArrowRight,
  AlertCircle, Eye, History, Trash2
} from 'lucide-react';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 10;

const LOADING_STEPS = [
  { label: 'Uploading & compressing document...', icon: FileUp },
  { label: 'Extracting text & biomedical parameters via OCR...', icon: ScanLine },
  { label: 'Benchmarking values against clinical reference ranges...', icon: Activity },
  { label: 'Translating complex medical terminology into plain English...', icon: Sparkles },
  { label: 'Synthesizing clinical summary & recommendations...', icon: HeartPulse }
];

const SAMPLE_REPORTS = [
  {
    id: 'sample-cbc',
    title: 'Complete Blood Count (CBC)',
    category: 'Blood Panel',
    icon: '🩸',
    description: 'Routine blood panel showing mild microcytic anemia and low ferritin levels.',
    data: {
      success: true,
      reportType: 'Complete Blood Count (CBC) with Iron Profile',
      summary: 'Your blood test indicates mild microcytic anemia, most commonly caused by low iron reserves (ferritin). Your red blood cell count and hemoglobin are slightly below the standard reference range, which may explain occasional fatigue, lightheadedness, or reduced stamina. Platelets and white blood cells are completely normal, showing no signs of acute infection or bleeding disorder.',
      findings: [
        {
          name: 'Hemoglobin (Hb)',
          value: '10.4 g/dL',
          reference: '12.0 - 15.5 g/dL',
          status: 'abnormal',
          note: 'Slightly low. Hemoglobin is the protein in red blood cells that carries oxygen from your lungs to the rest of your body.'
        },
        {
          name: 'Total RBC Count',
          value: '3.8 million/mcL',
          reference: '4.0 - 5.2 million/mcL',
          status: 'abnormal',
          note: 'Mildly decreased, consistent with mild nutritional iron deficiency.'
        },
        {
          name: 'Serum Ferritin (Iron Storage)',
          value: '14 ng/mL',
          reference: '20 - 200 ng/mL',
          status: 'abnormal',
          note: 'Low. Ferritin reflects the total amount of iron stored in your liver and tissues.'
        },
        {
          name: 'Total Leucocyte Count (WBC)',
          value: '6,800 /mcL',
          reference: '4,000 - 11,000 /mcL',
          status: 'normal',
          note: 'Healthy immune cell levels with no indication of active bacterial or viral infection.'
        },
        {
          name: 'Platelet Count',
          value: '260,000 /mcL',
          reference: '150,000 - 450,000 /mcL',
          status: 'normal',
          note: 'Normal clotting cell levels.'
        },
        {
          name: 'Mean Corpuscular Volume (MCV)',
          value: '76 fL',
          reference: '80 - 100 fL',
          status: 'abnormal',
          note: 'Low (microcytic). Red blood cells are slightly smaller than average due to iron scarcity.'
        }
      ],
      abnormalities: [
        'Hemoglobin (10.4 g/dL) is below the minimum normal threshold (12.0 g/dL), indicating mild anemia.',
        'Serum Ferritin (14 ng/mL) is depleted, confirming an iron-deficiency origin.',
        'MCV (76 fL) shows microcytic red blood cell morphology.'
      ],
      recommendations: [
        'Incorporate iron-rich foods into your diet: spinach, lentils, beans, fortified cereals, eggs, and lean meats.',
        'Pair iron foods with Vitamin C (e.g., lemon, oranges, bell peppers) to dramatically increase iron absorption.',
        'Avoid consuming tea or coffee with meals, as tannins inhibit iron uptake.',
        'Consult your doctor regarding a 2 to 3 month course of oral iron supplementation.',
        'Schedule a repeat CBC and Ferritin check in 8 to 12 weeks to monitor improvement.'
      ],
      doctorQuestions: [
        'Do you recommend starting an oral iron supplement, and which formulation causes the least gastrointestinal upset?',
        'Should we perform any additional screening (such as Vitamin B12 or celiac antibodies) to check absorption?',
        'When should I schedule a follow-up blood count to verify my hemoglobin recovery?'
      ],
      emergency: false,
      confidence: 0.96
    }
  },
  {
    id: 'sample-lipid',
    title: 'Comprehensive Lipid Profile',
    category: 'Cardiovascular',
    icon: '🧪',
    description: 'Cholesterol panel showing borderline elevated LDL and elevated triglycerides.',
    data: {
      success: true,
      reportType: 'Comprehensive Lipid Profile (Cholesterol Panel)',
      summary: 'Your lipid profile shows borderline elevated Total Cholesterol and LDL ("bad cholesterol"), along with mildly elevated Triglycerides. HDL ("good cholesterol") is within a satisfactory range. These findings suggest early cardiovascular risk factors that can typically be reversed or significantly improved through dietary modifications, reduced refined carbohydrates, and regular aerobic exercise.',
      findings: [
        {
          name: 'Total Cholesterol',
          value: '228 mg/dL',
          reference: '< 200 mg/dL',
          status: 'abnormal',
          note: 'Mildly elevated total circulating cholesterol in your bloodstream.'
        },
        {
          name: 'LDL Cholesterol ("Bad")',
          value: '148 mg/dL',
          reference: '< 100 mg/dL',
          status: 'abnormal',
          note: 'Elevated. Higher LDL can contribute to arterial plaque buildup over time if left unmanaged.'
        },
        {
          name: 'HDL Cholesterol ("Good")',
          value: '46 mg/dL',
          reference: '> 40 mg/dL (Men) / > 50 mg/dL (Women)',
          status: 'normal',
          note: 'Protective cholesterol that transports excess lipids back to the liver for clearance.'
        },
        {
          name: 'Triglycerides',
          value: '192 mg/dL',
          reference: '< 150 mg/dL',
          status: 'abnormal',
          note: 'Elevated. Strongly linked to dietary intake of sugars, refined starches, and alcohol.'
        },
        {
          name: 'Cholesterol / HDL Ratio',
          value: '4.95',
          reference: '< 5.0 (Optimal < 3.5)',
          status: 'normal',
          note: 'Borderline acceptable cardiovascular balance ratio.'
        }
      ],
      abnormalities: [
        'Total Cholesterol (228 mg/dL) exceeds desirable baseline (< 200 mg/dL).',
        'LDL Cholesterol (148 mg/dL) is in the borderline high range.',
        'Triglycerides (192 mg/dL) are mildly elevated.'
      ],
      recommendations: [
        'Adopt a Mediterranean-style dietary pattern: extra virgin olive oil, nuts, seeds, fatty fish, and whole grains.',
        'Minimize trans fats, ultra-processed fried foods, and refined sugars.',
        'Engage in 30 to 45 minutes of moderate aerobic activity (brisk walking, cycling, swimming) at least 5 days a week.',
        'Maintain healthy hydration and limit alcohol intake.',
        'Recheck full lipid profile in 3 to 6 months after lifestyle adjustments.'
      ],
      doctorQuestions: [
        'Based on my overall age, blood pressure, and family history, what is my 10-year cardiovascular risk score?',
        'Are lifestyle changes alone sufficient for now, or should we consider lipid-lowering therapy?',
        'Would you recommend an Lp(a) or ApoB test for deeper cardiovascular risk assessment?'
      ],
      emergency: false,
      confidence: 0.94
    }
  },
  {
    id: 'sample-thyroid',
    title: 'Thyroid Function Panel (TFT)',
    category: 'Endocrine',
    icon: '🦋',
    description: 'Thyroid test showing elevated TSH with normal Free T4 (Subclinical Hypothyroidism).',
    data: {
      success: true,
      reportType: 'Thyroid Function Test (TSH, FT3, FT4)',
      summary: 'Your thyroid profile exhibits a mildly elevated Thyroid Stimulating Hormone (TSH) while Free T4 and Free T3 remain within normal reference limits. This classic pattern represents mild Subclinical Hypothyroidism, meaning your pituitary gland is working slightly harder to signal your thyroid gland. Many people have mild or temporary fluctuations without requiring immediate prescription treatment.',
      findings: [
        {
          name: 'TSH (Thyroid Stimulating Hormone)',
          value: '6.45 mIU/L',
          reference: '0.40 - 4.20 mIU/L',
          status: 'abnormal',
          note: 'Elevated. Produced by the brain to stimulate thyroid hormone secretion.'
        },
        {
          name: 'Free T4 (Thyroxine)',
          value: '1.22 ng/dL',
          reference: '0.80 - 1.80 ng/dL',
          status: 'normal',
          note: 'Active circulating thyroid hormone is currently normal and adequate.'
        },
        {
          name: 'Free T3 (Triiodothyronine)',
          value: '3.1 pg/mL',
          reference: '2.3 - 4.2 pg/mL',
          status: 'normal',
          note: 'Active cellular energy hormone is within optimal range.'
        }
      ],
      abnormalities: [
        'TSH is elevated at 6.45 mIU/L (standard reference is 0.40 - 4.20 mIU/L).'
      ],
      recommendations: [
        'Check for symptoms of sluggish thyroid: unexpected weight gain, cold sensitivity, dry skin, or persistent lethargy.',
        'Ensure adequate dietary selenium and zinc (brazil nuts, pumpkin seeds, whole eggs).',
        'Avoid excessive raw cruciferous vegetables or extreme caloric restriction.',
        'Schedule a confirmatory re-test with Anti-TPO antibodies in 6 to 8 weeks to determine if autoimmune factors exist.'
      ],
      doctorQuestions: [
        'Does my TSH elevation warrant a thyroid antibody (Anti-TPO) test to rule out Hashimoto’s thyroiditis?',
        'Should we retest in 2 months before deciding on low-dose Levothyroxine therapy?',
        'Could any supplements or stress have temporarily influenced this result?'
      ],
      emergency: false,
      confidence: 0.97
    }
  }
];

const DOCUMENT_CATEGORIES = [
  {
    label: 'Blood Test',
    icon: '🩸',
    desc: 'CBC, Lipid Profile, LFT, KFT, HbA1c, Vitamins & Hormones'
  },
  {
    label: 'Prescription',
    icon: '💊',
    desc: 'Doctor handwriting, dosage schedule, active molecules & timing'
  },
  {
    label: 'X-Ray & MRI / CT',
    icon: '🩻',
    desc: 'Radiology impression, bone density, soft tissue findings'
  },
  {
    label: 'Ultrasound',
    icon: '🩺',
    desc: 'Abdomen, pelvic, Doppler sonography & organ measurements'
  },
  {
    label: 'Pathology & Biopsy',
    icon: '🔬',
    desc: 'Histopathology, culture reports, urine analysis & smears'
  }
];

const LOCAL_STORAGE_KEY = 'arogya_recent_analyzed_reports';

export default function ReportAnalyzer({ isDarkMode, onNavigateTab }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressStep, setProgressStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'abnormal', 'normal'
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryTip, setActiveCategoryTip] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const fileInputRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setRecentReports(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load report history from localStorage:', e);
    }
  }, []);

  const saveReportToHistory = useCallback((newResult, fileName) => {
    try {
      const item = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        fileName: fileName || 'Uploaded Document',
        reportType: newResult.reportType || 'Medical Report',
        summary: newResult.summary || '',
        data: newResult
      };
      setRecentReports((prev) => {
        const updated = [item, ...prev.filter((r) => r.reportType !== item.reportType || r.fileName !== item.fileName)].slice(0, 10);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.warn('Failed to save report to history:', e);
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setRecentReports([]);
  };

  const validateAndSetFile = useCallback((selectedFile) => {
    setError('');
    if (!selectedFile) return;

    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      setError('Unsupported file format. Please upload a PDF, JPG, PNG, or WEBP file.');
      return;
    }
    if (selectedFile.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File exceeds maximum size of ${MAX_SIZE_MB}MB. Please compress or crop the file.`);
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

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError('');
    setProgressStep(0);
    setUploadProgress(0);
    setSearchTerm('');
    setFilterMode('all');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadSampleReport = (sample) => {
    handleReset();
    setLoading(true);
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step < LOADING_STEPS.length) {
        setProgressStep(step);
      } else {
        clearInterval(interval);
        setLoading(false);
        setResult(sample.data);
        saveReportToHistory(sample.data, `Sample: ${sample.title}`);
      }
    }, 400);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please upload a medical report or select a demo sample first.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setProgressStep(0);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('report', file);

    progressIntervalRef.current = setInterval(() => {
      setProgressStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 2800);

    try {
      const apiURL = import.meta.env.VITE_API_URL || 'https://arogyabot-backend.onrender.com';
      const response = await axios.post(`${apiURL}/api/report-analyzer`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });

      if (!response?.data) {
        throw new Error('No diagnostic data returned from the analyzer.');
      }

      setResult(response.data);
      saveReportToHistory(response.data, file.name);
    } catch (err) {
      console.error('Report analysis error:', err);
      if (err.response) {
        if (err.response.status === 413) {
          setError('File exceeds 10MB limit. Please upload a smaller or compressed document.');
        } else if (err.response.status === 415) {
          setError('Unsupported file type. Please upload a standard PDF, JPG, PNG, or WEBP document.');
        } else if (err.response.data?.error) {
          setError(err.response.data.error);
        } else {
          setError(`Server communication error (${err.response.status}). Please try again.`);
        }
      } else if (err.request) {
        setError('Network timeout or connection error. Please check your internet connection.');
      } else {
        setError(err.message || 'Something went wrong while analyzing your document.');
      }
    } finally {
      clearInterval(progressIntervalRef.current);
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleCopySummary = async () => {
    if (!result) return;
    const textToCopy = `ArogyaBot Medical Report Analysis
Report Type: ${result.reportType || 'General Medical Report'}
Summary: ${result.summary}

Key Abnormalities:
${result.abnormalities?.map((a) => `• ${a}`).join('\n') || 'None'}

Recommendations:
${result.recommendations?.map((r) => `• ${r}`).join('\n') || 'None'}

(Disclaimer: AI-assisted analysis for informational reference only.)`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Failed to copy text:', e);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      const element = document.getElementById('report-analysis-export-container');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          clonedDoc.documentElement.classList.remove('dark');
          clonedDoc.body.classList.remove('dark');
          const el = clonedDoc.getElementById('report-analysis-export-container');
          if (el) {
            el.style.backgroundColor = '#ffffff';
            el.style.color = '#0f172a';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 16;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Header Banner
      pdf.setFillColor(79, 70, 229);
      pdf.rect(0, 0, pageWidth, 24, 'F');
      pdf.setFontSize(16);
      pdf.setTextColor(255, 255, 255);
      pdf.text('ArogyaBot Medical AI Report Analysis', margin, 15);

      pdf.setFontSize(8);
      pdf.setTextColor(220, 220, 255);
      pdf.text(`Analyzed on: ${new Date().toLocaleString('en-IN')}`, pageWidth - margin - 50, 15);

      let heightLeft = imgHeight;
      let position = 30;

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - position);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Footer disclaimer on all pages
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7.5);
        pdf.setTextColor(140, 140, 150);
        pdf.text(
          'Disclaimer: AI-generated clinical insights are for educational & informational purposes only. Always consult a qualified physician for diagnosis & treatment.',
          margin,
          pageHeight - 8
        );
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 15, pageHeight - 8);
      }

      pdf.save(`ArogyaBot_Analysis_${(result.reportType || 'Report').replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    } catch (err) {
      console.error('Error generating report PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  // Determine Overall Health Triage status
  const getOverallStatus = () => {
    if (!result) return null;
    if (result.emergency) {
      return {
        level: 'critical',
        badge: 'Critical / Immediate Medical Attention',
        color: 'bg-rose-500 text-white',
        border: 'border-rose-300 dark:border-rose-800',
        bgBox: 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100',
        icon: AlertCircle
      };
    }
    const hasAbnormal = (result.abnormalities && result.abnormalities.length > 0) ||
      (result.findings && result.findings.some((f) => f.status === 'abnormal' || f.status === 'critical'));

    if (hasAbnormal) {
      return {
        level: 'abnormal',
        badge: 'Actionable Abnormalities Flagged',
        color: 'bg-amber-500 text-white',
        border: 'border-amber-300 dark:border-amber-800',
        bgBox: 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100',
        icon: AlertTriangle
      };
    }
    return {
      level: 'normal',
      badge: 'All Values Within Normal Limits',
      color: 'bg-emerald-500 text-white',
      border: 'border-emerald-300 dark:border-emerald-800',
      bgBox: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100',
      icon: CheckCircle2
    };
  };

  // Filtered Findings
  const findingsList = Array.isArray(result?.findings) ? result.findings : [];
  const filteredFindings = findingsList.filter((f) => {
    if (filterMode === 'abnormal') {
      if (f.status === 'normal') return false;
    } else if (filterMode === 'normal') {
      if (f.status !== 'normal') return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const name = (f.name || '').toLowerCase();
      const val = (f.value || '').toLowerCase();
      const note = (f.note || '').toLowerCase();
      return name.includes(q) || val.includes(q) || note.includes(q);
    }
    return true;
  });

  const triage = getOverallStatus();

  return (
    <div className="animate-tab-fade-in space-y-6 max-w-5xl mx-auto pb-10">

      {/* HEADER HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-7 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-purple-500/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wide uppercase text-indigo-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
              AI Medical Vision & Diagnostic Assistant
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-white flex items-center gap-3">
              Medical Report Analyzer
            </h1>
            <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed font-normal">
              Upload blood tests, prescriptions, radiology summaries, or discharge slips. Get immediate plain-language breakdowns, flagged anomalies, and personalized questions to ask your doctor.
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-2 shrink-0">
            {recentReports.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white text-xs font-bold transition-all"
              >
                <History className="w-4 h-4 text-indigo-200" />
                <span>Recent History ({recentReports.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Feature badges ribbon */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 pt-5 border-t border-white/15">
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-100">
            <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <ScanLine className="w-3.5 h-3.5 text-indigo-200" />
            </div>
            <span>Instant Optical OCR</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-100">
            <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <Activity className="w-3.5 h-3.5 text-emerald-300" />
            </div>
            <span>Lab Value Benchmarking</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-100">
            <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-200" />
            </div>
            <span>100% Private & Safe</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-100">
            <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            </div>
            <span>Plain English Jargon Free</span>
          </div>
        </div>
      </div>

      {/* RECENT REPORTS DRAWER (COLLAPSIBLE) */}
      {showHistory && recentReports.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-3 animate-card-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Recent Analyses in this Session</h3>
            </div>
            <button
              onClick={clearHistory}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear History
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {recentReports.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setResult(item.data);
                  setShowHistory(false);
                }}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-slate-700/60 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-400 mb-1">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[140px]">{item.reportType}</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {item.fileName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {item.summary}
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  <span>View Details</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UPLOAD & DEMO SECTION (WHEN NO RESULT) */}
      {!result && !loading && (
        <div className="space-y-6">

          {/* MAIN DROPZONE CARD */}
          <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-sm transition-all">
            
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative group rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 border-2 border-dashed
                ${isDragging
                  ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 scale-[1.01] shadow-lg shadow-indigo-500/10'
                  : file
                    ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-slate-300 dark:border-slate-650 hover:border-indigo-500 hover:bg-slate-50/60 dark:hover:bg-slate-750/50'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {!file ? (
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-inner">
                    <FileUp className="w-10 h-10 transition-transform duration-300 group-hover:-translate-y-0.5" />
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-display font-bold text-slate-800 dark:text-white">
                      Drop your medical report here, or <span className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2">browse files</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                      Supports scanned PDFs, laboratory results, mobile photos & imaging summaries
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                    <span>PDF • JPG • PNG • WEBP</span>
                    <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                    <span>Max {MAX_SIZE_MB}MB</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-2" onClick={(e) => e.stopPropagation()}>
                  {previewUrl ? (
                    <div className="relative group/img rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-650 max-h-56">
                      <img src={previewUrl} alt="Report preview" className="max-h-56 w-auto object-contain rounded-xl" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <Eye className="w-4 h-4" /> Preview Image
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-indigo-50 dark:bg-slate-700 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow">
                        <FileText className="w-7 h-7" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate max-w-[260px]">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB • PDF Document
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Clinical AI Analysis
                    </span>
                    <button
                      onClick={handleReset}
                      className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-bold px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-sm font-medium animate-card-fade-in">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Upload Notice</p>
                  <p className="text-xs mt-0.5 opacity-90">{error}</p>
                </div>
              </div>
            )}

            {/* CTA BUTTON */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 items-center">
              <button
                onClick={handleAnalyze}
                disabled={!file}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl font-extrabold text-white bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2.5 text-base"
              >
                <Sparkles className="w-5 h-5 text-amber-300" />
                Analyze Medical Report
              </button>

              {file && (
                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-bold transition-all"
                >
                  Change Document
                </button>
              )}
            </div>
          </div>

          {/* DEMO / SAMPLE REPORTS PRESETS */}
          <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h3 className="text-base font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-lg">✨</span> No document on hand? Try a realistic sample
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click any verified clinical sample below to instantly test the AI analyzer engine
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 self-start sm:self-auto">
                1-Click Instant Demo
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              {SAMPLE_REPORTS.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => loadSampleReport(sample)}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:shadow-md hover:bg-indigo-50/40 dark:hover:bg-slate-750 cursor-pointer transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{sample.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {sample.category}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {sample.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {sample.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    <span>Load & Analyze Sample</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DOCUMENT TYPE GUIDANCE PILLS */}
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-500" /> Supported Report Types & What ArogyaBot Extracts
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {DOCUMENT_CATEGORIES.map((cat, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveCategoryTip(activeCategoryTip === idx ? null : idx)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all text-xs font-medium
                    ${activeCategoryTip === idx
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                    }`}
                >
                  <div className="text-lg mb-1">{cat.icon}</div>
                  <p className="font-bold">{cat.label}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                    {cat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* LOADING & SCANNER PROGRESS STATE */}
      {loading && (
        <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-3xl p-8 sm:p-12 shadow-sm text-center animate-card-fade-in space-y-8">
          
          {/* Pulsing Medical Core Animation */}
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute w-28 h-28 rounded-full bg-indigo-500/10 animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner relative">
              <HeartPulse className="w-12 h-12 animate-pulse text-indigo-600 dark:text-indigo-400" />
              <ScanLine className="w-12 h-12 text-indigo-400/60 absolute animate-scan-line" />
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-display font-extrabold text-slate-900 dark:text-white">
              Analyzing Medical Report...
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Our clinical AI is reading biomedical metrics, evaluating reference ranges, and generating plain-English insights.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto space-y-2">
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(15, Math.min(100, (progressStep + 1) * 20))}%` }}
              ></div>
            </div>
          </div>

          {/* Checklist of steps */}
          <div className="max-w-md mx-auto text-left space-y-2.5 bg-slate-50 dark:bg-slate-750/70 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            {LOADING_STEPS.map((step, idx) => {
              const isDone = idx < progressStep;
              const isCurrent = idx === progressStep;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 text-xs sm:text-sm font-medium transition-all ${isDone
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isCurrent
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-400 dark:text-slate-400 opacity-60'
                    }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs ${isDone
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                    : isCurrent
                      ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 animate-spin'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}>
                    {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : isCurrent ? <Loader2 className="w-3 h-3" /> : (idx + 1)}
                  </div>
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ANALYSIS RESULTS VIEW */}
      {result && !loading && (
        <div className="space-y-6 animate-card-fade-in">

          {/* TOP ACTION TOOLBAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Analysis Complete
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-400">• {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-500/20"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Rendering PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Report</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>New Analysis</span>
              </button>
            </div>
          </div>

          {/* EXPORTABLE REPORT CONTAINER (USED FOR PDF GENERATION) */}
          <div id="report-analysis-export-container" className="space-y-6">

            {/* EXECUTIVE HERO CARD */}
            <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-700">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                    <FileText className="w-3.5 h-3.5" /> {result.reportType || 'Medical Report'}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
                    Clinical Diagnostic Breakdown
                  </h2>
                </div>

                {/* Overall Triage Status & Confidence */}
                <div className="flex flex-wrap items-center gap-3">
                  {triage && (
                    <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold ${triage.border} ${triage.bgBox}`}>
                      <triage.icon className="w-4 h-4 shrink-0" />
                      <span>{triage.badge}</span>
                    </div>
                  )}

                  {result.confidence && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{(result.confidence * 100).toFixed(0)}% AI Confidence</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Text Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-purple-50/40 dark:from-slate-750 dark:to-slate-800 border border-indigo-100/80 dark:border-slate-700">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4" /> Plain-Language Executive Summary
                </h3>
                <p className="text-slate-700 dark:text-slate-200 text-sm sm:text-base leading-relaxed font-medium">
                  {result.summary}
                </p>
              </div>

              {/* Emergency Banner if applicable */}
              {result.emergency && (
                <div className="rounded-2xl p-5 bg-rose-500 text-white shadow-lg space-y-2 animate-pulse">
                  <div className="flex items-center gap-2 font-extrabold text-base">
                    <AlertCircle className="w-5 h-5" />
                    <span>Immediate Clinical Attention Recommended</span>
                  </div>
                  <p className="text-xs sm:text-sm text-rose-100">
                    One or more critical parameters exceed safe thresholds. Please seek prompt evaluation from an emergency clinic or treating physician.
                  </p>
                </div>
              )}
            </div>

            {/* KEY ABNORMALITIES HIGHLIGHT (IF ANY) */}
            {Array.isArray(result.abnormalities) && result.abnormalities.length > 0 && (
              <div className="bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">
                      Flagged Abnormal Findings ({result.abnormalities.length})
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Parameters or observations outside standard biological reference ranges
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  {result.abnormalities.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 flex items-start gap-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="font-medium leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QUANTITATIVE LAB FINDINGS & BIOMARKERS TABLE */}
            {findingsList.length > 0 && (
              <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-5">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-500" /> Detailed Biomarkers & Test Parameters
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Showing measured values, standard reference brackets, and clinical explanations
                    </p>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-700 p-1 text-xs font-bold">
                      <button
                        onClick={() => setFilterMode('all')}
                        className={`px-3 py-1 rounded-lg transition-all ${filterMode === 'all'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        All ({findingsList.length})
                      </button>
                      <button
                        onClick={() => setFilterMode('abnormal')}
                        className={`px-3 py-1 rounded-lg transition-all ${filterMode === 'abnormal'
                          ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Abnormal
                      </button>
                      <button
                        onClick={() => setFilterMode('normal')}
                        className={`px-3 py-1 rounded-lg transition-all ${filterMode === 'normal'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Normal
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search tests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Findings Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {filteredFindings.map((finding, i) => {
                    const isAbnormal = finding.status === 'abnormal' || finding.status === 'critical';
                    const isCritical = finding.status === 'critical';

                    return (
                      <div
                        key={i}
                        className={`p-4 rounded-2xl border transition-all space-y-2.5
                          ${isCritical
                            ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20'
                            : isAbnormal
                              ? 'border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/20'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-750/50'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                              {finding.name}
                            </h4>
                            {finding.reference && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                Ref Range: <span className="font-semibold">{finding.reference}</span>
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {finding.value}
                            </span>
                            <div className="mt-1">
                              <StatusBadge status={finding.status || 'normal'} />
                            </div>
                          </div>
                        </div>

                        {finding.note && (
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                            <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                            <p className="leading-relaxed">{finding.note}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {filteredFindings.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">
                    No biomarkers matched your search criteria.
                  </div>
                )}
              </div>
            )}

            {/* DOCTOR DISCUSSION GUIDE (SMART QUESTIONS TO ASK) */}
            {Array.isArray(result.doctorQuestions) && result.doctorQuestions.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 text-white rounded-3xl p-6 sm:p-7 shadow-md space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-display font-extrabold text-white">
                      Doctor Discussion Guide (Questions to Ask at Your Next Visit)
                    </h3>
                    <p className="text-xs text-indigo-100">
                      Take these AI-generated questions to your physician for an informed, high-value consultation
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  {result.doctorQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-start gap-3 text-xs sm:text-sm text-white"
                    >
                      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="font-medium leading-relaxed">{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACTIONABLE RECOMMENDATIONS & LIFESTYLE ADVICE */}
            {Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
              <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">
                      Recommended Next Steps & Clinical Guidance
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Dietary tweaks, monitoring intervals, and preventive health habits
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {result.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200/70 dark:border-slate-700 flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">
                        ✓
                      </span>
                      <p className="font-medium leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MEDICAL DISCLAIMER NOTICE */}
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400 font-medium space-y-1">
              <p className="flex items-center justify-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-indigo-500" /> Clinical AI Safety & Informational Disclaimer
              </p>
              <p>
                ArogyaBot Report Analyzer utilizes advanced multimodal AI models for educational interpretation. It is not an official medical diagnosis or replacement for a certified healthcare practitioner. Always discuss findings with your physician before modifying treatments or starting medications.
              </p>
            </div>

          </div>

          {/* BOTTOM NAVIGATION / ACTION CTA BAR */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-2xl py-3.5 font-extrabold transition-all shadow-md shadow-indigo-500/20"
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

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('care')}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-800 dark:text-white rounded-2xl py-3.5 font-bold transition-all border border-slate-200 dark:border-slate-650"
              >
                <Stethoscope className="h-4 w-4 text-indigo-500" /> Find Nearby Doctors & Labs
              </button>
            )}

            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl py-3.5 font-extrabold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md shadow-indigo-500/20"
            >
              <RotateCcw className="h-4 w-4" /> Analyze Another Document
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

function StatusBadge({ status }) {
  const norm = (status || 'normal').toLowerCase();
  if (norm === 'critical') {
    return (
      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
        <AlertCircle className="w-3 h-3" /> Critical High
      </span>
    );
  }
  if (norm === 'abnormal' || norm === 'high' || norm === 'elevated') {
    return (
      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
        <AlertTriangle className="w-3 h-3" /> Flagged / Abnormal
      </span>
    );
  }
  if (norm === 'low') {
    return (
      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border border-sky-300 dark:border-sky-800">
        <Activity className="w-3 h-3" /> Low
      </span>
    );
  }
  return (
    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
      <CheckCircle2 className="w-3 h-3" /> Normal
    </span>
  );
}
