// src/app/(auth)/login/page.js
import { LoginForm } from '../../../components/forms/login-form'

/**
 * Página de inicio de sesión
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dhermica Estética
          </h1>
          <p className="text-gray-600">
            Bienvenido al sistema de gestión
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}