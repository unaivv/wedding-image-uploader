import sharp from "sharp"

export const compressImage = async (filePath:string) => {
     try {
    // Cargar la imagen
    const imagen = sharp(filePath);

    // Redimensionar la imagen
    const imagenRedimensionada = await imagen
    .resize({ width: 400, height: 400 })
    .webp({ lossless: true })
    .toBuffer();

    // Guardar la imagen redimensionada (ejemplo)
    const newUrlWebp = filePath.replace(/(\.\w+)$/, '-compressed.webp');
    await sharp(imagenRedimensionada).toFile(newUrlWebp);

    console.log('Imagen redimensionada con éxito');
    // Retornar la ruta de la imagen redimensionada
    return newUrlWebp;

  } catch (error) {
    console.error('Error al procesar la imagen:', error);
  }
    
}


export const convertToWebp = async (filePath:string) => {
    try {
        // Cargar la imagen
        const imagen = sharp(filePath);

        // Convertir a WebP
        const imagenWebp = await imagen.webp({ lossless: true }).toBuffer();

        // Guardar la imagen WebP (ejemplo)
        const newUrlWebp = filePath.replace(/(\.\w+)$/, '.webp');
        await sharp(imagenWebp).toFile(newUrlWebp);

        console.log('Imagen convertida a WebP con éxito');
        // Retornar la ruta de la imagen WebP
        return newUrlWebp;

    } catch (error) {
        console.error('Error al convertir la imagen a WebP:', error);
    }
}