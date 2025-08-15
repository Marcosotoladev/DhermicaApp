/**
 * Ejemplos de estructuras de datos para la aplicación DHérmica
 * Estos objetos muestran la forma que tendrán los documentos en Firestore
 */

// Estructura del documento Client
export const clientExample = {
  id: "client_uuid",
  name: "Ana García",
  email: "ana@example.com", 
  phone: "+54911234567",
  dateOfBirth: new Date("1990-05-15"),
  medicalInfo: {
    diabetes: false,
    cancer: false,
    tattoos: true,
    allergies: "Ninguna conocida",
    medications: "",
    other: "Piel sensible"
  },
  createdAt: null, // Firebase.Timestamp
  updatedAt: null  // Firebase.Timestamp
}

// Estructura del documento Appointment  
export const appointmentExample = {
  id: "appointment_uuid",
  clientId: "client_uuid",
  clientName: "Ana García", 
  treatmentId: "treatment_uuid",
  professionalId: "prof_uuid",
  date: null, // Firebase.Timestamp (solo fecha)
  startTime: "14:00",
  endTime: "15:30", // Calculado automáticamente
  duration: 90, // En minutos
  price: 8500, // Opcional
  createdAt: null, // Firebase.Timestamp
  updatedAt: null  // Firebase.Timestamp
}

// Estructura del documento Treatment
export const treatmentExample = {
  id: "treatment_uuid",
  name: "Limpieza Facial Profunda",
  description: "Tratamiento completo de limpieza facial...",
  duration: 90, // En minutos
  basePrice: 8500,
  category: "Facial",
  imageUrl: "https://res.cloudinary.com/...",
  medicalRestrictions: ["diabetes", "cancer"],
  active: true,
  createdAt: null, // Firebase.Timestamp
  updatedAt: null  // Firebase.Timestamp
}