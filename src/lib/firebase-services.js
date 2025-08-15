// src/lib/firebase-services.js
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * Servicios para interactuar con Firestore
 * Incluye CRUD para todas las entidades de Dhermica
 */

// =============================================================================
// SERVICIOS PARA TRATAMIENTOS
// =============================================================================

export const treatmentService = {
  /**
   * Obtener todos los tratamientos activos
   */
  async getAll() {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, 'treatments'), 
          where('active', '==', true), 
          orderBy('name')
        )
      )
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }))
    } catch (error) {
      console.error('Error getting treatments:', error)
      throw error
    }
  },

  /**
   * Obtener tratamiento por ID
   */
  async getById(id) {
    try {
      const docRef = doc(db, 'treatments', id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      } else {
        return null
      }
    } catch (error) {
      console.error('Error getting treatment:', error)
      throw error
    }
  },

  /**
   * Crear nuevo tratamiento
   */
  async create(data) {
    try {
      const docRef = await addDoc(collection(db, 'treatments'), {
        ...data,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return docRef.id
    } catch (error) {
      console.error('Error creating treatment:', error)
      throw error
    }
  },

  /**
   * Actualizar tratamiento
   */
  async update(id, data) {
    try {
      const docRef = doc(db, 'treatments', id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating treatment:', error)
      throw error
    }
  },

  /**
   * Eliminar tratamiento (soft delete)
   */
  async delete(id) {
    try {
      const docRef = doc(db, 'treatments', id)
      await updateDoc(docRef, { 
        active: false, 
        updatedAt: serverTimestamp() 
      })
    } catch (error) {
      console.error('Error deleting treatment:', error)
      throw error
    }
  }
}

// =============================================================================
// SERVICIOS PARA PROFESIONALES
// =============================================================================

export const professionalService = {
  /**
   * Obtener todos los profesionales disponibles
   */
  async getAll() {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, 'professionals'), 
          where('available', '==', true), 
          orderBy('name')
        )
      )
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }))
    } catch (error) {
      console.error('Error getting professionals:', error)
      throw error
    }
  },

  /**
   * Obtener profesional por ID
   */
  async getById(id) {
    try {
      const docRef = doc(db, 'professionals', id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      } else {
        return null
      }
    } catch (error) {
      console.error('Error getting professional:', error)
      throw error
    }
  },

  /**
   * Crear nuevo profesional
   */
  async create(data) {
    try {
      const docRef = await addDoc(collection(db, 'professionals'), {
        ...data,
        available: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return docRef.id
    } catch (error) {
      console.error('Error creating professional:', error)
      throw error
    }
  },

  /**
   * Actualizar profesional
   */
  async update(id, data) {
    try {
      const docRef = doc(db, 'professionals', id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating professional:', error)
      throw error
    }
  }
}

// =============================================================================
// SERVICIOS PARA CLIENTES
// =============================================================================

export const clientService = {
  /**
   * Buscar clientes por término de búsqueda
   */
  async search(searchTerm) {
    try {
      // Obtener todos los clientes y filtrar en el cliente
      // (Firestore no tiene búsqueda full-text nativa)
      const querySnapshot = await getDocs(
        query(collection(db, 'clients'), orderBy('name'), limit(50))
      )
      
      const clients = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }))
      
      if (!searchTerm) return clients
      
      const searchLower = searchTerm.toLowerCase()
      return clients.filter(client =>
        client.name.toLowerCase().includes(searchLower) ||
        client.phone.includes(searchTerm) ||
        client.email.toLowerCase().includes(searchLower)
      )
    } catch (error) {
      console.error('Error searching clients:', error)
      throw error
    }
  },

  /**
   * Obtener cliente por ID
   */
  async getById(id) {
    try {
      const docRef = doc(db, 'clients', id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      } else {
        return null
      }
    } catch (error) {
      console.error('Error getting client:', error)
      throw error
    }
  },

  /**
   * Crear nuevo cliente
   */
  async create(data) {
    try {
      const docRef = await addDoc(collection(db, 'clients'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return docRef.id
    } catch (error) {
      console.error('Error creating client:', error)
      throw error
    }
  },

  /**
   * Actualizar cliente
   */
  async update(id, data) {
    try {
      const docRef = doc(db, 'clients', id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating client:', error)
      throw error
    }
  }
}

// =============================================================================
// SERVICIOS PARA CITAS
// =============================================================================

export const appointmentService = {
  /**
   * Obtener citas por fecha
   */
  async getByDate(date) {
    try {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const querySnapshot = await getDocs(
        query(
          collection(db, 'appointments'),
          where('date', '>=', Timestamp.fromDate(startOfDay)),
          where('date', '<=', Timestamp.fromDate(endOfDay)),
          orderBy('date'),
          orderBy('startTime')
        )
      )
      
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }))
    } catch (error) {
      console.error('Error getting appointments by date:', error)
      throw error
    }
  },

  /**
   * Obtener citas por profesional y fecha
   */
  async getByProfessionalAndDate(professionalId, date) {
    try {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const querySnapshot = await getDocs(
        query(
          collection(db, 'appointments'),
          where('professionalId', '==', professionalId),
          where('date', '>=', Timestamp.fromDate(startOfDay)),
          where('date', '<=', Timestamp.fromDate(endOfDay)),
          orderBy('date'),
          orderBy('startTime')
        )
      )
      
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }))
    } catch (error) {
      console.error('Error getting appointments by professional and date:', error)
      throw error
    }
  },

  /**
   * Obtener citas de un cliente
   */
  async getByClient(clientId) {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, 'appointments'),
          where('clientId', '==', clientId),
          orderBy('date', 'desc')
        )
      )
      
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }))
    } catch (error) {
      console.error('Error getting appointments by client:', error)
      throw error
    }
  },

  /**
   * Crear nueva cita
   */
  async create(data) {
    try {
      const docRef = await addDoc(collection(db, 'appointments'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return docRef.id
    } catch (error) {
      console.error('Error creating appointment:', error)
      throw error
    }
  },

  /**
   * Actualizar cita
   */
  async update(id, data) {
    try {
      const docRef = doc(db, 'appointments', id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating appointment:', error)
      throw error
    }
  },

  /**
   * Eliminar cita
   */
  async delete(id) {
    try {
      const docRef = doc(db, 'appointments', id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Error deleting appointment:', error)
      throw error
    }
  }
}