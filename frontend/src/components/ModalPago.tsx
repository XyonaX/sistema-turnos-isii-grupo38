'use client';

import { useEffect, useState, useCallback } from 'react';

import api from '../services/api';

type MetodoPago = 'credito_debito' | 'transferencia' | 'efectivo';

interface ModalPagoProps {
  pagoId: string;
  plazoExpiracion: Date;
  monto?: number;
  servicioNombre?: string;
  onPagoExitoso: (turno: any) => void;
  onPagoCancelado: () => void;
  onPagoExpirado: () => void;
  onClose: () => void;
}

function calcularSegundosRestantes(plazo: Date): number {
  return Math.max(0, Math.floor((new Date(plazo).getTime() - Date.now()) / 1000));
}

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function ModalPago({
  pagoId,
  plazoExpiracion,
  monto,
  servicioNombre,
  onPagoExitoso,
  onPagoCancelado,
  onPagoExpirado,
  onClose,
}: ModalPagoProps) {
  const [segundosRestantes, setSegundosRestantes] = useState(() =>
    calcularSegundosRestantes(plazoExpiracion)
  );
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('credito_debito');
  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const [cvv, setCvv] = useState('');
  const [cbu, setCbu] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expirado, setExpirado] = useState(false);
  const [erroresCampo, setErroresCampo] = useState<{
    numeroTarjeta?: string;
    vencimiento?: string;
    cvv?: string;
    cbu?: string;
  }>({});

  const cancelarPago = useCallback(async () => {
    try {
      await api.post('/pagos/cancelar', { pagoId });
    } catch {
      // ignorar error de red al cancelar
    }
  }, [pagoId]);

  const handleCancelar = useCallback(async () => {
    await cancelarPago();
    onPagoCancelado();
  }, [cancelarPago, onPagoCancelado]);

  const handleExpirar = useCallback(async () => {
    await cancelarPago();
    onPagoExpirado();
  }, [cancelarPago, onPagoExpirado]);

  // Contador regresivo
  useEffect(() => {
    if (segundosRestantes <= 0) {
      setExpirado(true);
      handleExpirar();
      return;
    }

    const interval = setInterval(() => {
      setSegundosRestantes((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          setExpirado(true);
          handleExpirar();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  function handleNumeroTarjetaChange(valor: string) {
    const soloDigitos = valor.replace(/\D/g, '').slice(0, 16);
    const formateado = soloDigitos.replace(/(.{4})/g, '$1 ').trim();
    setNumeroTarjeta(formateado);
    setErroresCampo((prev) => ({ ...prev, numeroTarjeta: undefined }));
  }

  function handleVencimientoChange(valor: string) {
    const soloDigitos = valor.replace(/\D/g, '').slice(0, 4);
    const formateado =
      soloDigitos.length > 2 ? `${soloDigitos.slice(0, 2)}/${soloDigitos.slice(2)}` : soloDigitos;
    setVencimiento(formateado);
    setErroresCampo((prev) => ({ ...prev, vencimiento: undefined }));
  }

  function validarCampos(): boolean {
    const errores: typeof erroresCampo = {};

    if (metodoPago === 'credito_debito') {
      const digitos = numeroTarjeta.replace(/\s/g, '');
      if (digitos.length !== 16) errores.numeroTarjeta = 'Número de tarjeta inválido (16 dígitos)';

      const [mm, aa] = vencimiento.split('/');
      const mesNum = parseInt(mm, 10);
      const anioNum = parseInt(aa, 10);
      const ahora = new Date();
      const anioActual = ahora.getFullYear() % 100;
      const mesActual = ahora.getMonth() + 1;

      if (!mm || !aa || vencimiento.length !== 5 || mesNum < 1 || mesNum > 12) {
        errores.vencimiento = 'Vencimiento inválido (MM/AA)';
      } else if (anioNum < anioActual || (anioNum === anioActual && mesNum < mesActual)) {
        errores.vencimiento = 'La tarjeta está vencida';
      }

      if (cvv.length !== 3) errores.cvv = 'CVV inválido (3 dígitos)';
    }

    if (metodoPago === 'transferencia') {
      if (cbu.length !== 22) errores.cbu = 'El CBU debe tener exactamente 22 dígitos';
    }

    setErroresCampo(errores);
    return Object.keys(errores).length === 0;
  }

  const handlePagar = async () => {
    if (!validarCampos()) return;

    setLoading(true);
    setError(null);

    let datosCliente: { numeroTarjeta: string; vencimiento: string; cvv: string };

    if (metodoPago === 'credito_debito') {
      datosCliente = { numeroTarjeta: numeroTarjeta.replace(/\s/g, ''), vencimiento, cvv };
    } else if (metodoPago === 'transferencia') {
      datosCliente = { numeroTarjeta: cbu, vencimiento: '', cvv: '' };
    } else {
      datosCliente = { numeroTarjeta: 'EFECTIVO', vencimiento: '', cvv: '' };
    }

    try {
      const { data } = await api.post('/pagos/procesar', {
        pagoId,
        datosCliente,
        metodoPago,
      });

      if (data.exito) {
        onPagoExitoso(data.turno);
      } else {
        setError(data.error || 'El pago fue rechazado. Intentá nuevamente.');
      }
    } catch (err: any) {
      const mensaje =
        err.response?.data?.message || 'Error al procesar el pago. Intentá nuevamente.';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  const tiempoColor =
    segundosRestantes < 60
      ? 'text-red-500'
      : segundosRestantes < 180
        ? 'text-yellow-500'
        : 'text-[var(--primary)]';

  const tabClass = (metodo: MetodoPago) =>
    `flex-1 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
      metodoPago === metodo
        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
        : 'bg-[var(--bg)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Completar pago</h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              Elegí el método de pago para confirmar el turno
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)] mb-0.5">Tiempo restante</p>
            <span className={`text-2xl font-mono font-bold ${tiempoColor}`}>
              {formatTiempo(segundosRestantes)}
            </span>
          </div>
        </div>

        {/* Total a abonar */}
        {monto !== undefined && (
          <div className="flex items-center justify-between px-4 py-3 mb-4 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-xl">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Total a abonar</p>
              {servicioNombre && (
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{servicioNombre}</p>
              )}
            </div>
            <span className="text-2xl font-bold text-[var(--primary)]">
              ${Number(monto).toLocaleString('es-AR')}
            </span>
          </div>
        )}

        {/* Selector de método de pago */}
        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => {
              setMetodoPago('credito_debito');
              setError(null);
              setErroresCampo({});
            }}
            className={tabClass('credito_debito')}
          >
            Crédito/Débito
          </button>
          <button
            type="button"
            onClick={() => {
              setMetodoPago('transferencia');
              setError(null);
              setErroresCampo({});
            }}
            className={tabClass('transferencia')}
          >
            Transferencia
          </button>
          <button
            type="button"
            onClick={() => {
              setMetodoPago('efectivo');
              setError(null);
              setErroresCampo({});
            }}
            className={tabClass('efectivo')}
          >
            Efectivo
          </button>
        </div>

        {/* Formulario dinámico según método */}
        <div className="mb-5">
          {metodoPago === 'credito_debito' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                  Número de tarjeta
                </label>
                <input
                  type="text"
                  value={numeroTarjeta}
                  onChange={(e) => handleNumeroTarjetaChange(e.target.value)}
                  placeholder="#### #### #### ####"
                  maxLength={19}
                  disabled={loading || expirado}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 disabled:opacity-50"
                />
                {erroresCampo.numeroTarjeta && (
                  <p className="text-red-500 text-xs mt-1">{erroresCampo.numeroTarjeta}</p>
                )}
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                    Vencimiento
                  </label>
                  <input
                    type="text"
                    value={vencimiento}
                    onChange={(e) => handleVencimientoChange(e.target.value)}
                    placeholder="MM/AA"
                    maxLength={5}
                    disabled={loading || expirado}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 disabled:opacity-50"
                  />
                  {erroresCampo.vencimiento && (
                    <p className="text-red-500 text-xs mt-1">{erroresCampo.vencimiento}</p>
                  )}
                </div>
                <div className="w-28">
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={(e) => {
                      setCvv(e.target.value.replace(/\D/g, ''));
                      setErroresCampo((prev) => ({ ...prev, cvv: undefined }));
                    }}
                    placeholder="###"
                    maxLength={3}
                    disabled={loading || expirado}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 disabled:opacity-50"
                  />
                  {erroresCampo.cvv && (
                    <p className="text-red-500 text-xs mt-1">{erroresCampo.cvv}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {metodoPago === 'transferencia' && (
            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                CBU
              </label>
              <input
                type="text"
                value={cbu}
                onChange={(e) => {
                  setCbu(e.target.value.replace(/\D/g, ''));
                  setErroresCampo((prev) => ({ ...prev, cbu: undefined }));
                }}
                placeholder="CBU (22 dígitos)"
                maxLength={22}
                disabled={loading || expirado}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 disabled:opacity-50"
              />
              {erroresCampo.cbu && <p className="text-red-500 text-xs mt-1">{erroresCampo.cbu}</p>}
            </div>
          )}

          {metodoPago === 'efectivo' && (
            <div className="px-4 py-4 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-[var(--text-secondary)] text-sm leading-relaxed">
              Abonás al momento de tu turno en el local. Tu turno quedará confirmado
              automáticamente.
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Expirado */}
        {expirado && (
          <div className="mb-4 px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-700 dark:text-yellow-400 text-sm font-medium">
            El tiempo para completar el pago ha expirado. La franja fue liberada.
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancelar}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-[var(--border)] text-[var(--text-primary)] font-semibold rounded-xl hover:bg-[var(--bg)] transition-all cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handlePagar}
            disabled={loading || expirado}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] disabled:bg-gray-400 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Procesando...
              </>
            ) : (
              'Confirmar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
