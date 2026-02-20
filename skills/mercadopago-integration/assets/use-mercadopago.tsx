// React Hook for MercadoPago OAuth Connection
// Usage: const { connect, isConnected } = useMercadoPago(tenant, { onSuccess: refreshTenant });

import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const MP_CLIENT_ID = import.meta.env.VITE_MP_CLIENT_ID;
const MP_REDIRECT_URI = import.meta.env.VITE_MP_REDIRECT_URI;

interface Tenant {
  id: string;
  mercadopago_access_token?: string | null;
  mercadopago_connected_at?: string | null;
}

interface UseMercadoPagoOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useMercadoPago(tenant: Tenant | null, options: UseMercadoPagoOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const isConnected = !!tenant?.mercadopago_access_token;

  // Handle OAuth callback
  useEffect(() => {
    const mpSuccess = searchParams.get('mp_success');
    const mpError = searchParams.get('mp_error');

    if (mpSuccess === 'true') {
      toast({ title: 'MercadoPago conectado', description: 'Cuenta vinculada correctamente.' });
      options.onSuccess?.();
      searchParams.delete('mp_success');
      setSearchParams(searchParams, { replace: true });
    }

    if (mpError) {
      const errorMessages: Record<string, string> = {
        missing_params: 'Parámetros faltantes',
        token_exchange_failed: 'Error al obtener tokens',
        db_update_failed: 'Error al guardar credenciales',
      };
      toast({
        title: 'Error al conectar MercadoPago',
        description: errorMessages[mpError] || `Error: ${mpError}`,
        variant: 'destructive',
      });
      options.onError?.(mpError);
      searchParams.delete('mp_error');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, toast, options]);

  // Initiate OAuth flow
  const connect = useCallback(() => {
    if (!tenant?.id || !MP_CLIENT_ID || !MP_REDIRECT_URI) {
      toast({ title: 'Error de configuración', variant: 'destructive' });
      return;
    }

    const authUrl = new URL('https://auth.mercadopago.com.ar/authorization');
    authUrl.searchParams.set('client_id', MP_CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('platform_id', 'mp');
    authUrl.searchParams.set('redirect_uri', MP_REDIRECT_URI);
    authUrl.searchParams.set('state', tenant.id);

    window.location.href = authUrl.toString();
  }, [tenant?.id, toast]);

  return { connect, isConnected, connectedAt: tenant?.mercadopago_connected_at };
}
