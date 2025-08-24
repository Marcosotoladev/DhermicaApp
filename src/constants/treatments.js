// src/constants/treatments.js

export const AVAILABLE_TREATMENTS = [
  // APARATOLOGÍA
  {
    id: 'aparatologia',
    name: 'Aparatología',
    category: 'aparatos',
    subcategories: [
      { id: 'aparatos_hifu', name: 'HiFu', description: 'Ultrasonido focalizado de alta intensidad', genders: ['hombre', 'mujer'] },
      { id: 'aparatos_lipolaser', name: 'Lipolaser', description: 'Láser para reducción de grasa', genders: ['hombre', 'mujer'] },
      { id: 'aparatos_liposonix', name: 'Liposonix', description: 'Ultrasonido para eliminación de grasa', genders: ['hombre', 'mujer'] },
      { id: 'aparatos_radiofrecuencia', name: 'Radiofrecuencia', description: 'Reafirmación por ondas electromagnéticas', genders: ['hombre', 'mujer'] },
      { id: 'aparatos_ultracavitador', name: 'Ultracavitador', description: 'Cavitación ultrasónica', genders: ['hombre', 'mujer'] },
      { id: 'aparatos_vacumterapia', name: 'Vacumterapia', description: 'Terapia de vacío', genders: ['hombre', 'mujer'] }
    ]
  },

  // CEJAS
  {
    id: 'cejas',
    name: 'Cejas',
    category: 'facial',
    subcategories: [
      { id: 'cejas_laminado', name: 'Laminado', description: 'Alisado y disciplinado de cejas', genders: ['hombre', 'mujer'] },
      { id: 'cejas_perfilado', name: 'Perfilado', description: 'Depilación y diseño de cejas', genders: ['hombre', 'mujer'] }
    ]
  },

  // CORPORALES
  {
    id: 'corporales',
    name: 'Corporales',
    category: 'corporal',
    subcategories: [
      { id: 'corporales_drenaje', name: 'Drenaje', description: 'Drenaje linfático manual', genders: ['hombre', 'mujer'] },
      { id: 'corporales_electroestimulacion', name: 'Electroestimulación', description: 'Estimulación eléctrica muscular', genders: ['hombre', 'mujer'] },
      { id: 'corporales_lipolaser', name: 'Lipolaser', description: 'Láser corporal para reducción de grasa', genders: ['hombre', 'mujer'] },
      { id: 'corporales_liposonix', name: 'Liposonix', description: 'Ultrasonido corporal para eliminación de grasa', genders: ['hombre', 'mujer'] },
      { id: 'corporales_masajes_reductores', name: 'Masajes reductores', description: 'Masajes específicos para reducir medidas', genders: ['hombre', 'mujer'] },
      { id: 'corporales_pulido_cremas', name: 'Pulido con cremas', description: 'Exfoliación corporal con cremas', genders: ['hombre', 'mujer'] },
      { id: 'corporales_pulido_diamante', name: 'Pulido con punta de diamante', description: 'Microdermoabrasión corporal', genders: ['hombre', 'mujer'] },
      { id: 'corporales_ultracavitador', name: 'Ultracavitador', description: 'Cavitación corporal', genders: ['hombre', 'mujer'] },
      { id: 'corporales_vacumterapia', name: 'Vacumterapia', description: 'Terapia de vacío corporal', genders: ['hombre', 'mujer'] }
    ]
  },

  // DEPILACIÓN
  {
    id: 'depilacion',
    name: 'Depilación',
    category: 'depilacion',
    subcategories: [
      { id: 'depilacion_definitiva_laser', name: 'Definitiva láser sin gel', description: 'Depilación definitiva con tecnología láser', genders: ['hombre', 'mujer'] },
      { id: 'depilacion_cera', name: 'Depilación con cera', description: 'Depilación tradicional con cera', genders: ['hombre', 'mujer'] }
    ]
  },

  // FACIALES
  {
    id: 'faciales',
    name: 'Faciales',
    category: 'facial',
    subcategories: [
      { id: 'faciales_estimulacion', name: 'Estimulación facial', description: 'Estimulación eléctrica facial', genders: ['hombre', 'mujer'] },
      { id: 'faciales_extraccion_puntos', name: 'Extracción de puntos negros', description: 'Limpieza profunda de comedones', genders: ['hombre', 'mujer'] },
      { id: 'faciales_hifu', name: 'HiFu', description: 'Ultrasonido focalizado facial', genders: ['hombre', 'mujer'] },
      { id: 'faciales_limpieza', name: 'Limpieza', description: 'Limpieza facial profunda', genders: ['hombre', 'mujer'] },
      { id: 'faciales_peeling', name: 'Peeling', description: 'Exfoliación química facial', genders: ['hombre', 'mujer'] },
      { id: 'faciales_radiofrecuencia', name: 'Radiofrecuencia facial', description: 'Reafirmación facial por radiofrecuencia', genders: ['hombre', 'mujer'] }
    ]
  },

  // MANOS
  {
    id: 'manos',
    name: 'Manos',
    category: 'estetica',
    subcategories: [
      { id: 'manos_belleza', name: 'Belleza de Manos', description: 'Cuidado completo de manos', genders: ['hombre', 'mujer'] }
    ]
  },

  // PESTAÑAS
  {
    id: 'pestanas',
    name: 'Pestañas',
    category: 'facial',
    subcategories: [
      { id: 'pestanas_permanente', name: 'Permanente', description: 'Permanente de pestañas', genders: ['mujer'] },
      { id: 'pestanas_lifting', name: 'Lifting', description: 'Curvatura y elevación de pestañas', genders: ['mujer'] }
    ]
  },

  // PIES
  {
    id: 'pies',
    name: 'Pies',
    category: 'estetica',
    subcategories: [
      { id: 'pies_belleza', name: 'Belleza de pies', description: 'Cuidado completo de pies', genders: ['hombre', 'mujer'] }
    ]
  }
]

// Función helper para obtener el nombre de un tratamiento por ID
export const getTreatmentNameById = (id) => {
  // Buscar en categorías principales
  const mainTreatment = AVAILABLE_TREATMENTS.find(t => t.id === id)
  if (mainTreatment) return mainTreatment.name
  
  // Buscar en subcategorías
  for (const treatment of AVAILABLE_TREATMENTS) {
    if (treatment.subcategories) {
      const subTreatment = treatment.subcategories.find(sub => sub.id === id)
      if (subTreatment) return subTreatment.name
    }
  }
  
  return id
}

// Función helper para obtener múltiples nombres de tratamientos
export const getTreatmentNamesByIds = (ids) => {
  return ids.map(id => getTreatmentNameById(id))
}

// Función helper para obtener tratamiento completo (categoría + subcategoría)
export const getFullTreatmentById = (id) => {
  // Buscar en categorías principales
  const mainTreatment = AVAILABLE_TREATMENTS.find(t => t.id === id)
  if (mainTreatment) {
    return {
      category: mainTreatment,
      subcategory: null,
      fullName: mainTreatment.name,
      genders: ['hombre', 'mujer'] // Por defecto todas las categorías
    }
  }
  
  // Buscar en subcategorías
  for (const treatment of AVAILABLE_TREATMENTS) {
    if (treatment.subcategories) {
      const subTreatment = treatment.subcategories.find(sub => sub.id === id)
      if (subTreatment) {
        return {
          category: treatment,
          subcategory: subTreatment,
          fullName: `${treatment.name} - ${subTreatment.name}`,
          genders: subTreatment.genders
        }
      }
    }
  }
  
  return null
}

// Función para filtrar tratamientos por género
export const getTreatmentsByGender = (gender) => {
  const filtered = []
  
  AVAILABLE_TREATMENTS.forEach(category => {
    const filteredSubcategories = category.subcategories?.filter(sub => 
      sub.genders.includes(gender)
    ) || []
    
    if (filteredSubcategories.length > 0) {
      filtered.push({
        ...category,
        subcategories: filteredSubcategories
      })
    }
  })
  
  return filtered
}

// Función para obtener todas las subcategorías de una categoría
export const getSubcategoriesByCategory = (categoryId) => {
  const category = AVAILABLE_TREATMENTS.find(t => t.id === categoryId)
  return category?.subcategories || []
}

// Función para obtener solo las categorías principales (sin subcategorías)
export const getMainCategories = () => {
  return AVAILABLE_TREATMENTS.map(({ subcategories, ...category }) => category)
}

// Función para obtener todos los tratamientos aplanados (categorías + subcategorías)
export const getAllTreatmentsFlat = () => {
  const flat = []
  
  AVAILABLE_TREATMENTS.forEach(category => {
    // Agregar categoría principal
    flat.push({
      id: category.id,
      name: category.name,
      type: 'category',
      category: category.category,
      genders: ['hombre', 'mujer']
    })
    
    // Agregar subcategorías si existen
    if (category.subcategories) {
      category.subcategories.forEach(sub => {
        flat.push({
          id: sub.id,
          name: sub.name,
          description: sub.description,
          type: 'subcategory',
          category: category.category,
          parentId: category.id,
          fullName: `${category.name} - ${sub.name}`,
          genders: sub.genders
        })
      })
    }
  })
  
  return flat
}

// Categorías de tratamientos agrupadas por tipo
export const TREATMENT_CATEGORIES = {
  FACIAL: AVAILABLE_TREATMENTS.filter(t => t.category === 'facial').map(t => t.id),
  CORPORAL: AVAILABLE_TREATMENTS.filter(t => t.category === 'corporal').map(t => t.id),
  DEPILACION: AVAILABLE_TREATMENTS.filter(t => t.category === 'depilacion').map(t => t.id),
  APARATOS: AVAILABLE_TREATMENTS.filter(t => t.category === 'aparatos').map(t => t.id),
  ESTETICA: AVAILABLE_TREATMENTS.filter(t => t.category === 'estetica').map(t => t.id)
}

// Géneros disponibles
export const AVAILABLE_GENDERS = [
  { id: 'hombre', name: 'Hombre' },
  { id: 'mujer', name: 'Mujer' }
]

export default AVAILABLE_TREATMENTS