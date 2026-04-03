import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Image as ImageIcon, X, ShieldCheck, QrCode, Scan, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QRScannerCard({ onScan }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startCamera = () => {
    setIsScanning(true);
    setErrorMsg('');
    setScanResult('');
    
    // We wait for the DOM to render the #qr-reader div
    setTimeout(() => {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      }
      html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          setScanResult(decodedText);
          html5QrCodeRef.current.stop().then(() => {
            setIsScanning(false);
            if (onScan) onScan(decodedText);
          }).catch(console.error);
        },
        (errorMessage) => {
          // ignore background scanning errors
        }
      ).catch((err) => {
        console.error(err);
        setErrorMsg("Deteksi izin kamera gagal atau tidak didukung di browser ini.");
        setIsScanning(false);
      });
    }, 150);
  };

  const stopCamera = () => {
    if (html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.stop().then(() => {
        setIsScanning(false);
      }).catch(console.error);
    } else {
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setErrorMsg('');
    setScanResult('');
    
    try {
      const html5QrCodeFile = new Html5Qrcode("qr-hidden-reader");
      const decodedText = await html5QrCodeFile.scanFile(file, true);
      setScanResult(decodedText);
      if (onScan) onScan(decodedText);
    } catch (err) {
      setErrorMsg("Tidak ada QR Code / Token yang ditemukan di gambar tersebut.");
    }
    e.target.value = ''; // reset file input
  };

  const handleNavigateResult = () => {
    if (scanResult.startsWith('http://') || scanResult.startsWith('https://')) {
      window.location.href = scanResult;
    } else {
      // Just copy or alert
      navigator.clipboard.writeText(scanResult);
      alert("Hasil Scan Disalin: " + scanResult);
    }
  };

  return (
    <div className="w-full bg-[#12121e]/80 backdrop-blur-2xl border border-indigo-500/20 rounded-[32px] p-6 lg:p-8 shadow-[0_15px_40px_rgba(99,102,241,0.15)] relative overflow-hidden group mt-6">
      {/* Background Decor */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-500/10 blur-[50px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0covL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgMjAgMTAgTSAxMCAwIEwgMTAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30 pointer-events-none" />
      {/* Hidden div for file scanning */}
      <div id="qr-hidden-reader" className="hidden"></div>
      
      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex-1 w-full text-center sm:text-left">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/30 shadow-inner mb-4 mx-auto sm:mx-0">
            <QrCode size={28} className="text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]" />
          </div>
          <h3 className="text-xl md:text-2xl font-black text-white mb-2 tracking-tight">Node Access Scanner</h3>
          <p className="text-xs md:text-sm text-slate-400 font-medium leading-relaxed max-w-sm mx-auto sm:mx-0">
            Scan Secure Access Token (QR Code) rekan Anda menggunakan kamera atau unggah dari galeri.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <button 
            onClick={startCamera} 
            className="w-full sm:w-48 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] flex justify-center items-center gap-2 active:scale-95"
          >
            <Camera size={16} /> Scan Camera
          </button>
          
          <label className="w-full sm:w-48 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex justify-center items-center gap-2 cursor-pointer active:scale-95">
            <ImageIcon size={16} /> Upload Image
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      <AnimatePresence>
        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-bold text-rose-400 text-center uppercase tracking-widest relative z-10">
            {errorMsg}
          </motion.div>
        )}

        {scanResult && !isScanning && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 p-5 bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/30 rounded-2xl relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck size={20} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Token Terdekripsi</span>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex justify-between items-center break-all gap-4">
               <span className="text-sm font-mono text-slate-300 line-clamp-2">{scanResult}</span>
               <button onClick={handleNavigateResult} className="w-10 h-10 bg-indigo-500/20 hover:bg-indigo-500 rounded-lg flex items-center justify-center text-indigo-300 hover:text-white transition-all border border-indigo-500/30 shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                 <LinkIcon size={16} />
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isScanning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
             <div className="w-full max-w-sm relative">
                <button onClick={stopCamera} className="absolute -top-12 right-0 w-10 h-10 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all z-20">
                  <X size={20} />
                </button>
                <div className="relative rounded-[2rem] overflow-hidden border-4 border-indigo-500/50 shadow-[0_0_50px_rgba(99,102,241,0.5)] bg-black aspect-square flex items-center justify-center">
                  <div id="qr-reader" className="w-full h-full object-cover"></div>
                  {/* Scanner overlay animation */}
                  <div className="absolute inset-0 z-10 pointer-events-none">
                    <motion.div animate={{ y: ['0%', '100%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399]" />
                    {/* Corners */}
                    <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl" />
                    <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl" />
                    <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl" />
                    <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-indigo-400 rounded-br-xl" />
                  </div>
                </div>
                <h3 className="text-center text-white mt-6 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                  <Scan size={16} className="text-indigo-400 animate-pulse" /> Scanning Secure Token...
                </h3>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
