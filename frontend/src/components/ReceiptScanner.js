import React, { useState, useRef } from 'react';
import { scanReceipt } from '../services/api';

const CATEGORIES = [
  'Alimentación',
  'Transporte',
  'Entretenimiento',
  'Salud',
  'Servicios',
  'Educación',
  'Vivienda',
  'Ropa',
  'Tecnología',
  'Otros',
];

function ReceiptScanner({ onScanComplete, onCancel }) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    // Validar tipo
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Tipo de archivo no válido. Usa JPG, PNG o PDF.');
      return;
    }

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo es demasiado grande (máx 10MB).');
      return;
    }

    setError(null);

    // Crear preview para imágenes
    if (file.type !== 'application/pdf') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview('pdf');
    }

    // Escanear con OCR
    performScan(file);
  };

  const performScan = async (file) => {
    setScanning(true);
    setScannedData(null);
    try {
      const response = await scanReceipt(file);
      if (response.data.success) {
        setScannedData(response.data.data);
      } else {
        setError('No se pudo extraer información del recibo.');
      }
    } catch (err) {
      setError('Error al escanear el recibo. Intente de nuevo.');
    } finally {
      setScanning(false);
    }
  };

  const handleConfirm = () => {
    if (scannedData) {
      onScanComplete({
        description: scannedData.description || '',
        amount: scannedData.amount || '',
        category: '',
        date: scannedData.date || '',
        receipt_url: scannedData.temp_file || null,
      });
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">
        <div className="scanner-header">
          <h2>📷 Escanear Recibo</h2>
          <button className="btn-close" onClick={onCancel}>✕</button>
        </div>

        <div className="scanner-body">
          {!preview ? (
            <div
              className={`dropzone ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleChange}
                style={{ display: 'none' }}
              />
              <div className="dropzone-content">
                <div className="dropzone-icon">📄</div>
                <p>Arrastra tu recibo aquí</p>
                <p className="dropzone-sub">o haz clic para seleccionar</p>
                <p className="dropzone-formats">JPG, PNG, PDF (máx 10MB)</p>
              </div>
              <button className="btn-dropzone" onClick={onButtonClick}>
                Seleccionar Archivo
              </button>
            </div>
          ) : (
            <div className="preview-container">
              <div className="preview-image">
                {preview === 'pdf' ? (
                  <div className="pdf-preview">
                    <div className="pdf-icon">📕</div>
                    <p>PDF cargado</p>
                  </div>
                ) : (
                  <img src={preview} alt="Preview" />
                )}
              </div>

              {scanning && (
                <div className="scan-progress">
                  <div className="scan-spinner"></div>
                  <p>Escaneando recibo...</p>
                </div>
              )}

              {scannedData && (
                <div className="scan-results">
                  <h3>✅ Datos Extraídos</h3>
                  <div className="scan-result-item">
                    <span>Descripción:</span>
                    <strong>{scannedData.description}</strong>
                  </div>
                  {scannedData.amount && (
                    <div className="scan-result-item">
                      <span>Monto:</span>
                      <strong>${scannedData.amount}</strong>
                    </div>
                  )}
                  {scannedData.date && (
                    <div className="scan-result-item">
                      <span>Fecha:</span>
                      <strong>{scannedData.date}</strong>
                    </div>
                  )}
                  {scannedData.merchant && (
                    <div className="scan-result-item">
                      <span>Comercio:</span>
                      <strong>{scannedData.merchant}</strong>
                    </div>
                  )}
                  {scannedData.confidence && (
                    <div className="scan-confidence">
                      Confianza: {Math.round(scannedData.confidence)}%
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="scan-error">
                  <span>⚠️ {error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="scanner-footer">
          <button className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          {preview && !scanning && (
            <>
              <button className="btn-secondary" onClick={() => {
                setPreview(null);
                setScannedData(null);
                setError(null);
              }}>
                Nuevo Archivo
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirm}
                disabled={!scannedData}
              >
                Usar Datos Extraídos
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReceiptScanner;