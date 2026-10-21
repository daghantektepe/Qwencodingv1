import { ProjectTemplate } from '../../types/templates';

export const screenplayPreset: ProjectTemplate = {
  id: 'preset-screenplay-feature',
  name: 'Uzun Metraj Sinema Senaryosu',
  category: 'scriptwriting',
  description:
    'Endüstri standardı Fountain formatıyla uyumlu, sahne başlıkları, diyaloglar ve karakter kartları barındıran senaryo taslağı.',
  icon: '🎬',
  targetAudience: 'Senaristler, yönetmenler ve film yapımcıları',
  version: '1.0.0',
  targets: {
    totalWords: 20000,
  },
  rootNodes: [
    {
      id: 'node-sc-title-page',
      title: 'Kapak ve Logline',
      type: 'document',
      synopsis: 'Film adı, yazar bilgisi, logline ve sinopsis özeti.',
      content: 'Title: FİLMİN ADI\nCredit: Yazan\nAuthor: Senarist Adı\nDraft date: 2026\n\n=== LOGLINE ===\nSıradan bir hayat süren bir dedektif, geçmişine dair karanlık bir sırla yüzleşir.\n',
    },
    {
      id: 'node-sc-act-1',
      title: '1. Perde (Sayfa 1-30)',
      type: 'folder',
      synopsis: 'Açılış sekansı, karakterin tanıtımı ve katalizör olay.',
      children: [
        {
          id: 'node-scene-1',
          title: 'Sahne 1: Açılış Görüntüsü',
          type: 'document',
          content: 'EXT. ESKİ LİMAN - GECE\n\nYoğun bir sis denizin üzerini kaplamıştır. Uzaktan bir geminin sireni duyulur.\n\nAHMET (40\'lar)\nIslak pardösüsünün yakasını kaldırır. Cebinden eski bir çakmak çıkarır.\n',
        },
        {
          id: 'node-scene-2',
          title: 'Sahne 2: Katalizör Olay',
          type: 'document',
          content: 'INT. POLİS MERKEZİ - GÜN\n\nTelsizden acil anons geçer.\n\nPOLİS MEMURU (V.O.)\nTüm birimler, 4. caddede olağanüstü durum bildirildi.\n',
        },
      ],
    },
    {
      id: 'node-sc-act-2',
      title: '2. Perde (Sayfa 30-90)',
      type: 'folder',
      synopsis: 'Soruşturmanın derinleşmesi, labirent ve orta nokta sürprizi.',
      children: [
        {
          id: 'node-scene-3',
          title: 'Sahne 3: Yeni Dünyaya Adım',
          type: 'document',
          content: 'INT. TERK EDİLMİŞ DEPO - GECE\n\nAhmet fenerin ışığını tozlu kutuların üzerinde gezdirir.\n',
        },
      ],
    },
    {
      id: 'node-sc-act-3',
      title: '3. Perde (Sayfa 90-110)',
      type: 'folder',
      synopsis: 'Zamanla yarış, nihai yüzleşme ve çözülme.',
      children: [
        {
          id: 'node-scene-4',
          title: 'Sahne 4: Final Yüzleşmesi',
          type: 'document',
          content: 'EXT. SAAT KULESİ - GÜN BATIMI\n\nİki gölge birbirine yaklaşır.\n',
        },
      ],
    },
    {
      id: 'node-sc-characters',
      title: 'Karakter Listesi ve Mekanlar',
      type: 'folder',
      children: [
        {
          id: 'node-sc-char-list',
          title: 'Karakter Dökümü',
          type: 'document',
          content: '# Karakter Listesi\n\n- AHMET: Başkomiser, sessiz ve gözlemci.\n- LEYLA: Araştırmacı gazeteci.\n',
        },
      ],
    },
  ],
};
