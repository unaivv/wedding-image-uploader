import sharp from "sharp"

export const compressImage = async (filePath: string) => {
  try {
    const imagen = sharp(filePath);

    const imagenRedimensionada = await imagen
      .resize({ width: 400, height: 400 })
      .webp({ lossless: true, quality: 70 })
      .toBuffer();

    const newUrlWebp = filePath.replace(/(\.\w+)$/, '-compressed.webp');
    await sharp(imagenRedimensionada).toFile(newUrlWebp);

    console.log('Imagen redimensionada con éxito');
    return newUrlWebp;

  } catch (error) {
    console.error('Error al procesar la imagen:', error);
  }

}


export const convertToWebp = async (filePath: string) => {
  try {
    const imagen = sharp(filePath);

    const imagenWebp = await imagen
      .webp({ lossless: true, quality: 70 })
      .toBuffer();

    const newUrlWebp = filePath.replace(/(\.\w+)$/, '.webp');
    await sharp(imagenWebp).toFile(newUrlWebp);

    console.log('Imagen convertida a WebP con éxito');
    return newUrlWebp;

  } catch (error) {
    console.error('Error al convertir la imagen a WebP:', error);
  }
}