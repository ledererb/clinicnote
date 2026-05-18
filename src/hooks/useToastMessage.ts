import { toast as sonnerToast } from 'sonner';

type ToastFunction = (msg: string) => void;

interface ToastInterceptor {
  (msg: string): void;
  success: ToastFunction;
  error: ToastFunction;
  info: ToastFunction;
  warning: ToastFunction;
  promise: typeof sonnerToast.promise;
  dismiss: typeof sonnerToast.dismiss;
}

export const toast: ToastInterceptor = Object.assign(
  (msg: string) => { sonnerToast(msg); },
  {
    success: (msg: string) => sonnerToast.success(msg),
    error: (msg: string) => sonnerToast.error(msg),
    info: (msg: string) => sonnerToast.info(msg),
    warning: (msg: string) => sonnerToast.warning(msg),
    promise: sonnerToast.promise,
    dismiss: sonnerToast.dismiss,
  }
);
