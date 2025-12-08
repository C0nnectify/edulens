import type { EditorHandle } from '../components/Editor';

/**
 * Shared PDF export using pdfMake + dynamic font loading.
 * Reuses multi-font logic from SOP implementation.
 */
export async function downloadEditorPdf(editorRef: React.RefObject<EditorHandle | null>, filename: string) {
  try {
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    const pdfFonts = await import('pdfmake/build/vfs_fonts');
    // @ts-expect-error no types
    const htmlToPdfmake = (await import('html-to-pdfmake')).default;
    const pdfMake = (pdfMakeModule as any).default || pdfMakeModule;

    const loadFont = async (url: string): Promise<string> => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Font fetch failed: ${url}`);
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    };

    const fontConfigs: Record<string, { paths: Record<string,string>; vfsNames: Record<string,string>; }> = {
      TimesNewRoman: {
        paths: {
          normal: '/fonts/times-new-roman/Times New Roman.ttf',
          bold: '/fonts/times-new-roman/Times New Roman - Bold.ttf',
          italics: '/fonts/times-new-roman/Times New Roman - Italic.ttf',
          bolditalics: '/fonts/times-new-roman/Times New Roman - Bold Italic.ttf',
        },
        vfsNames: {
          normal: 'TimesNewRoman.ttf',
          bold: 'TimesNewRoman-Bold.ttf',
          italics: 'TimesNewRoman-Italic.ttf',
          bolditalics: 'TimesNewRoman-BoldItalic.ttf',
        }
      },
      Arial: {
        paths: {
          normal: '/fonts/arial-font/arial.ttf',
          bold: '/fonts/arial-font/G_ari_bd.TTF',
          italics: '/fonts/arial-font/G_ari_i.TTF',
          bolditalics: '/fonts/arial-font/ARIBL0.ttf',
        },
        vfsNames: {
          normal: 'Arial.ttf',
          bold: 'Arial-Bold.ttf',
          italics: 'Arial-Italic.ttf',
          bolditalics: 'Arial-BoldItalic.ttf',
        }
      },
      Gelasio: {
        paths: {
          normal: '/fonts/Gelasio/static/Gelasio-Regular.ttf',
          bold: '/fonts/Gelasio/static/Gelasio-Bold.ttf',
          italics: '/fonts/Gelasio/static/Gelasio-Italic.ttf',
          bolditalics: '/fonts/Gelasio/static/Gelasio-BoldItalic.ttf',
        },
        vfsNames: {
          normal: 'Gelasio.ttf',
          bold: 'Gelasio-Bold.ttf',
          italics: 'Gelasio-Italic.ttf',
          bolditalics: 'Gelasio-BoldItalic.ttf',
        }
      },
      Inter: {
        paths: {
          normal: '/fonts/Inter/static/Inter_18pt-Regular.ttf',
          bold: '/fonts/Inter/static/Inter_18pt-Bold.ttf',
          italics: '/fonts/Inter/static/Inter_18pt-Italic.ttf',
          bolditalics: '/fonts/Inter/static/Inter_18pt-BoldItalic.ttf',
        },
        vfsNames: {
          normal: 'Inter.ttf',
          bold: 'Inter-Bold.ttf',
          italics: 'Inter-Italic.ttf',
          bolditalics: 'Inter-BoldItalic.ttf',
        }
      },
      Merriweather: {
        paths: {
          normal: '/fonts/Merriweather/static/Merriweather_24pt-Regular.ttf',
          bold: '/fonts/Merriweather/static/Merriweather_24pt-Bold.ttf',
          italics: '/fonts/Merriweather/static/Merriweather_24pt-Italic.ttf',
          bolditalics: '/fonts/Merriweather/static/Merriweather_24pt-BoldItalic.ttf',
        },
        vfsNames: {
          normal: 'Merriweather.ttf',
          bold: 'Merriweather-Bold.ttf',
          italics: 'Merriweather-Italic.ttf',
          bolditalics: 'Merriweather-BoldItalic.ttf',
        }
      },
    };

    const html = editorRef.current?.getHTML();
    if (!html) { alert('No content to export.'); return; }
    const ret = htmlToPdfmake(html);

    // Detect font usage from html
    let selectedFont = 'TimesNewRoman';
    for (const f of Object.keys(fontConfigs)) {
      if (html.includes(`font-family: ${f}`)) { selectedFont = f; break; }
    }

    const vfs: Record<string,string> = { ...(pdfFonts as any).vfs };
    const fonts: Record<string,{normal:string;bold:string;italics:string;bolditalics:string;}> = {
      Roboto: { normal: 'Roboto-Regular.ttf', bold: 'Roboto-Medium.ttf', italics: 'Roboto-Italic.ttf', bolditalics: 'Roboto-MediumItalic.ttf' }
    };

    // Load all fonts once (could optimize by only loading selectedFont)
    for (const [fontName, config] of Object.entries(fontConfigs)) {
      const [normal, bold, italics, bolditalics] = await Promise.all([
        loadFont(config.paths.normal),
        loadFont(config.paths.bold),
        loadFont(config.paths.italics),
        loadFont(config.paths.bolditalics),
      ]);
      vfs[config.vfsNames.normal] = normal;
      vfs[config.vfsNames.bold] = bold;
      vfs[config.vfsNames.italics] = italics;
      vfs[config.vfsNames.bolditalics] = bolditalics;
      fonts[fontName] = {
        normal: config.vfsNames.normal,
        bold: config.vfsNames.bold,
        italics: config.vfsNames.italics,
        bolditalics: config.vfsNames.bolditalics,
      };
    }

    const docDefinition = {
      content: ret,
      pageSize: 'LETTER' as const,
      pageMargins: [72,72,72,72] as [number,number,number,number],
      defaultStyle: { font: selectedFont, fontSize: 12, lineHeight: 1.5, alignment: 'justify' as const },
      styles: {
        h1: { fontSize: 16, bold: true, alignment: 'center' as const, margin: [0,0,0,18] as [number,number,number,number] },
        h2: { fontSize: 14, bold: true, margin: [0,14,0,8] as [number,number,number,number] },
        h3: { fontSize: 12, bold: true, margin: [0,12,0,6] as [number,number,number,number] },
        p: { margin: [0,0,0,12] as [number,number,number,number] },
      }
    };

    const pdfDocGenerator = (pdfMake as any).createPdf(docDefinition, undefined, fonts, vfs);
    pdfDocGenerator.download(filename);
  } catch (e) {
    console.error('PDF export failed', e);
    alert('PDF export failed.');
  }
}
