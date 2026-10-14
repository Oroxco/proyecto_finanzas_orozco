import type { LanguageInterface } from 'photoeditorsdk/no-polyfills';

/** Traducciones del editor. Los nombres propios de los filtros se conservan. */
export const editorFotoLocale: LanguageInterface = {
  common: {
    error: 'Error',
    warning: 'Aviso',
    color: {
      title: 'Color',
      colorPicker: {
        hex: 'Hex', r: 'R', g: 'V', b: 'A',
        sliderHue: 'Tono',
        sliderOpacity: 'Opacidad del color',
      },
    },
  },
  mainCanvasActions: {
    buttonExport: 'Guardar foto',
    buttonUndo: 'Deshacer',
    buttonRedo: 'Rehacer',
    buttonClose: 'Cerrar editor',
  },
  infoModals: {
    loading: { heading: 'Abriendo la foto', body: 'Espera un momento.' },
    exporting: { heading: 'Preparando la foto', body: 'Aplicando tus cambios.' },
    saving: { heading: 'Guardando', body: 'Espera un momento.' },
    resizing: { heading: 'Ajustando el tamaño', body: 'Espera un momento.' },
    loadingFonts: { heading: 'Cargando tipografías', body: 'Espera un momento.' },
    stickerLoading: { heading: 'Cargando adhesivo', body: 'Espera un momento.' },
  },
  errorModals: {
    imageLoading: {
      heading: 'No se pudo abrir la foto',
      body: 'Revisa que la imagen sea válida y vuelve a intentarlo.',
      buttonYes: 'Reintentar', buttonNo: 'Cerrar', headingDelimiter: ':',
    },
    rendering: {
      heading: 'No se pudo procesar la foto',
      body: 'Vuelve a intentarlo para aplicar los cambios.',
      buttonYes: 'Reintentar', buttonNo: 'Cerrar', headingDelimiter: ':',
    },
    fontLoading: {
      heading: 'No se pudo cargar la tipografía',
      body: 'Tipografías sin cargar: ${error}',
      buttonNo: 'Cerrar', headingDelimiter: ':',
    },
    webcamUnavailable: {
      heading: 'Cámara no disponible',
      body: 'No se pudo acceder a la cámara: ${error}',
      buttonYes: 'Cerrar', headingDelimiter: ':',
    },
    invalidFileType: {
      heading: 'Formato no compatible',
      body: 'Selecciona un archivo de imagen compatible.',
      buttonNo: 'Cerrar', headingDelimiter: ':',
    },
    stickerLoading: {
      heading: 'No se pudo cargar el adhesivo',
      body: 'Elige otro adhesivo o vuelve a intentarlo.',
      buttonNo: 'Cerrar', headingDelimiter: ':',
    },
    unexpectedError: {
      heading: 'No se pudo completar la operación',
      body: 'Ocurrió un error: ${error}',
      buttonYes: 'Reintentar', buttonNo: 'Cerrar', headingDelimiter: ':',
    },
  },
  warningModals: {
    imageResized: {
      heading: 'Tamaño ajustado',
      body: 'La foto supera ${megapixels} megapíxeles. Se ajustó a ${width} × ${height} píxeles.',
      buttonYes: 'Continuar', headingDelimiter: ':',
    },
    discardChanges: {
      heading: 'Cambios pendientes',
      body: 'Al reemplazar la foto se perderán los cambios sin guardar.',
      buttonYes: 'Descartar cambios', buttonNo: 'Seguir editando', headingDelimiter: ':',
    },
    unsavedChanges: {
      heading: 'Cambios pendientes',
      body: 'Tienes cambios sin guardar. ¿Quieres salir del editor?',
      buttonYes: 'Salir sin guardar', buttonNo: 'Seguir editando', headingDelimiter: ':',
    },
    unsupportedSerializationVersion: {
      heading: 'Edición de una versión anterior',
      body: 'Al recuperar esta edición algunos elementos pueden verse diferentes.',
      buttonYes: 'Continuar', buttonNo: 'Cancelar', headingDelimiter: ':',
    },
    unsupportedWebGLRenderer: {
      heading: 'Rendimiento limitado',
      body: 'Este dispositivo puede tardar más en procesar la foto.',
      buttonYes: 'Continuar', headingDelimiter: ':',
    },
  },
  library: {
    title: 'Imágenes',
    controls: {
      buttonUpload: 'Elegir imagen', buttonWebcamOpen: 'Abrir cámara',
      buttonWebcamClose: 'Cerrar cámara', placeholderSearch: 'Buscar imágenes',
      noResults: 'Sin resultados', itemAriaLabel: 'Elegir ${label}',
      categoryAriaLabel: 'Ver ${label}',
    },
  },
  transform: {
    title: 'Recortar y girar',
    controls: {
      buttonReset: 'Restablecer', checkboxKeepResolution: 'Conservar resolución',
      inputCropSize: 'Tamaño del recorte', inputHeight: 'alto', inputWidth: 'ancho',
      tabFlipAndRotate: 'Voltear y girar', tabResolution: 'Resolución',
      tabCropSize: 'Recorte', itemAriaLabel: 'Recortar con formato ${label}',
      categoryAriaLabel: 'Ver formatos de ${label}',
      inputHeightAriaLabel: 'Alto del recorte', inputWidthAriaLabel: 'Ancho del recorte',
    },
    categories: {
      imgly_transforms_common: 'Formatos comunes', imgly_transforms_facebook: 'Facebook',
      imgly_transforms_twitter: 'Twitter', imgly_transforms_instagram: 'Instagram',
    },
    items: {
      imgly_transform_common_custom: 'Libre', imgly_transform_common_square: 'Cuadrado',
      imgly_transform_common_4: '4:3', imgly_transform_common_16: '16:9',
      imgly_transform_common_3: '3:4', imgly_transform_common_9: '9:16',
      imgly_transform_facebook_profile: 'Perfil', imgly_transform_facebook_title: 'Portada',
      imgly_transform_facebook_post: 'Publicación', imgly_transform_instagram_story: 'Historia',
      imgly_transform_instagram_landscape: 'Horizontal', imgly_transform_instagram_portrait: 'Vertical',
      imgly_transform_instagram_square: 'Cuadrado', imgly_transform_twitter_profile: 'Perfil',
      imgly_transform_twitter_title: 'Portada', imgly_transform_twitter_post: 'Publicación',
    },
    transformActions: {
      buttonFlipHorizontal: 'Voltear horizontalmente', buttonFlipVertical: 'Voltear verticalmente',
      buttonRotateClockwise: 'Girar a la derecha', buttonRotateAntiClockwise: 'Girar a la izquierda',
    },
  },
  adjustment: {
    title: 'Ajustes',
    controls: { buttonReset: 'Restablecer ajustes' },
    categories: { basics: 'Básicos', refinements: 'Detalles' },
    items: {
      brightness: 'Brillo', saturation: 'Saturación', contrast: 'Contraste',
      sharpness: 'Nitidez', gamma: 'Gamma', clarity: 'Claridad', exposure: 'Exposición',
      shadows: 'Sombras', highlights: 'Luces', whites: 'Blancos', blacks: 'Negros',
      temperature: 'Temperatura',
    },
  },
  filter: {
    title: 'Filtros',
    controls: {
      buttonReset: 'Quitar filtro', sliderIntensity: 'Intensidad del filtro',
      itemAriaLabel: 'Aplicar filtro ${label}', categoryAriaLabel: 'Ver filtros ${label}',
    },
    categories: {
      imgly_filter_category_duotone: 'Dos tonos', imgly_filter_category_bw: 'Blanco y negro',
      imgly_filter_category_vintage: 'Retro', imgly_filter_category_smooth: 'Suaves',
      imgly_filter_category_cold: 'Fríos', imgly_filter_category_warm: 'Cálidos',
      imgly_filter_category_legacy: 'Clásicos',
    },
  },
  focus: {
    title: 'Desenfoque',
    controls: {
      buttonReset: 'Quitar desenfoque', sliderIntensity: 'Intensidad del desenfoque',
      itemAriaLabel: 'Aplicar desenfoque ${label}',
    },
    items: { radial: 'Radial', mirrored: 'Simétrico', linear: 'Lineal', gaussian: 'Uniforme' },
    history: { focusPosition: 'Posición del enfoque', focusSize: 'Tamaño del enfoque' },
  },
  text: {
    title: 'Texto',
    controls: {
      buttonNew: 'Agregar texto', dropdownFontFamily: 'Tipografía', textFontSize: 'Tamaño de letra',
      selectAlignment: 'Alineación', selectFontColor: 'Color del texto', selectBackgroundColor: 'Color de fondo',
      sliderLineSpacing: 'Espacio entre líneas', tabColor: 'Color', tabBgColor: 'Fondo',
      tabAlignment: 'Alineación', tabLineHeight: 'Interlineado', tabFontSize: 'Tamaño',
    },
    canvasControls: {
      placeholderText: 'Escribe aquí', buttonSave: 'Aplicar', buttonClose: 'Cancelar', inputText: 'Texto',
    },
    canvasActions: {
      buttonEdit: 'Editar texto', buttonDelete: 'Eliminar', buttonBringToFront: 'Traer al frente', buttonDuplicate: 'Duplicar',
    },
    history: {
      add: 'Agregar texto', edit: 'Editar texto', resize: 'Tamaño del texto', position: 'Posición del texto',
      rotation: 'Giro del texto', delete: 'Eliminar texto', order: 'Orden del texto',
      alignment: 'Alineación', textColor: 'Color del texto', backgroundColor: 'Fondo del texto',
      fontFamily: 'Tipografía', fontStyle: 'Estilo de letra', lineSpacing: 'Interlineado', width: 'Ancho del texto',
    },
  },
  textdesign: {
    title: 'Texto con diseño',
    controls: {
      buttonNew: 'Agregar diseño', buttonShuffle: 'Cambiar diseño', selectColor: 'Color del texto',
      tabColor: 'Color', tabShuffle: 'Diseño', itemAriaLabel: 'Agregar diseño ${label}',
    },
    canvasControls: {
      placeholderText: 'Escribe tu mensaje', buttonSave: 'Aplicar', buttonClose: 'Cancelar', inputText: 'Texto del diseño',
    },
    canvasActions: {
      buttonEdit: 'Editar texto', buttonInvert: 'Invertir colores', buttonDelete: 'Eliminar',
      buttonBringToFront: 'Traer al frente', buttonDuplicate: 'Duplicar',
    },
    history: {
      add: 'Agregar diseño de texto', edit: 'Editar diseño de texto', resize: 'Tamaño del diseño',
      position: 'Posición del diseño', rotation: 'Giro del diseño', delete: 'Eliminar diseño', order: 'Orden del diseño',
      color: 'Color del diseño', shuffle: 'Cambiar diseño', invert: 'Invertir colores', padding: 'Margen del diseño',
    },
  },
  sticker: {
    title: 'Adhesivos',
    controls: {
      buttonUpload: 'Agregar adhesivo propio', sliderOpacity: 'Opacidad', selectColor: 'Color del adhesivo',
      tabColor: 'Color', tabOpacity: 'Opacidad', itemAriaLabel: 'Agregar adhesivo ${label}',
      categoryAriaLabel: 'Ver adhesivos ${label}',
    },
    categories: {
      imgly_sticker_emoticons: 'Emoticonos', imgly_sticker_shapes: 'Formas', imgly_sticker_custom: 'Mis adhesivos',
    },
    canvasActions: {
      buttonDelete: 'Eliminar', buttonBringToFront: 'Traer al frente', buttonDuplicate: 'Duplicar',
      buttonFlipHorizontal: 'Voltear horizontalmente', buttonFlipVertical: 'Voltear verticalmente',
    },
    history: {
      add: 'Agregar adhesivo', resize: 'Tamaño del adhesivo', position: 'Posición del adhesivo',
      rotation: 'Giro del adhesivo', delete: 'Eliminar adhesivo', order: 'Orden del adhesivo',
      color: 'Color del adhesivo', opacity: 'Opacidad del adhesivo', flip: 'Voltear adhesivo',
    },
  },
  brush: {
    title: 'Pincel',
    controls: {
      buttonReset: 'Borrar trazos', sliderSize: 'Grosor', sliderHardness: 'Dureza', selectColor: 'Color del pincel',
      tabSize: 'Grosor', tabHardness: 'Dureza', tabColor: 'Color',
    },
    history: { brushStroke: 'Trazo del pincel' },
  },
  frame: {
    title: 'Marcos',
    controls: {
      buttonReset: 'Quitar marco', sliderOpacity: 'Opacidad', sliderSize: 'Tamaño del marco', selectColor: 'Color del marco',
      tabColor: 'Color', tabOpacity: 'Opacidad', tabSize: 'Tamaño', itemAriaLabel: 'Aplicar marco ${label}',
    },
    items: {
      imgly_frame_dia: 'Diapositiva', imgly_frame_art_decor: 'Decorativo', imgly_frame_black_passepartout: 'Negro',
      imgly_frame_lowpoly_shadow: 'Sombra geométrica', imgly_frame_wood_passepartout: 'Madera',
    },
  },
  overlay: {
    title: 'Superposiciones',
    controls: {
      buttonReset: 'Quitar superposición', sliderOpacity: 'Opacidad', carouselBlendMode: 'Modo de mezcla',
      blendModeNormal: 'Normal', blendModeOverlay: 'Superponer', blendModeHardLight: 'Luz intensa',
      blendModeSoftLight: 'Luz suave', blendModeMultiply: 'Multiplicar', blendModeDarken: 'Oscurecer',
      blendModeLighten: 'Aclarar', blendModeScreen: 'Trama', blendModeColorBurn: 'Subexponer color',
      tabOpacity: 'Opacidad', tabBlendMode: 'Mezcla', itemAriaLabel: 'Aplicar superposición ${label}',
    },
    items: {
      imgly_overlay_bokeh: 'Luces desenfocadas', imgly_overlay_chop: 'Fragmentos', imgly_overlay_clouds: 'Nubes',
      imgly_overlay_golden: 'Dorado', imgly_overlay_grain: 'Grano', imgly_overlay_hearts: 'Corazones',
      imgly_overlay_lightleak1: 'Destello 1', imgly_overlay_lightleak2: 'Destello 2', imgly_overlay_metal: 'Metal',
      imgly_overlay_mosaic: 'Mosaico', imgly_overlay_painting: 'Pintura', imgly_overlay_paper: 'Papel',
      imgly_overlay_rain: 'Lluvia', imgly_overlay_vintage: 'Retro', imgly_overlay_wall1: 'Pared 1',
      imgly_overlay_wall2: 'Pared 2', imgly_overlay_wood: 'Madera',
    },
  },
};
