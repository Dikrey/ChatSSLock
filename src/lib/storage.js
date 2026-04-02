import { supabase } from './supabase';

export const uploadFile = async (file) => {
  try {
    const fileName = `${crypto.randomUUID()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('media') // Make sure you have a 'media' bucket in your Supabase project
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(data.path);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { success: false, error: error.message };
  }
};
