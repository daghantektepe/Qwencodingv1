import { ProjectTemplate } from '../../types/templates';

export const novelPreset: ProjectTemplate = {
  id: 'preset-novel-three-act',
  name: 'Klasik Roman (3 Perdelik Yapı)',
  category: 'fiction',
  description:
    'Aristoteles ve Joseph Campbell kahramanın yolculuğu ilkelerine dayanan, giriş-gelişme-sonuç ve dönüm noktalarıyla kurgulanmış kapsamlı roman şablonu.',
  icon: '📖',
  targetAudience: 'Roman yazarları, kurgu ve edebiyat üreticileri',
  version: '1.0.0',
  targets: {
    totalWords: 75000,
  },
  rootNodes: [
    {
      id: 'node-act-1',
      title: '1. Perde: Başlangıç ve Dünyanın Tanıtımı',
      type: 'folder',
      synopsis: 'Kahramanın sıradan dünyası, kırılma anı ve maceraya çağrı.',
      children: [
        {
          id: 'node-ch-1',
          title: 'Bölüm 1: Sıradan Dünya',
          type: 'document',
          synopsis: 'Ana karakterin günlük rutini, eksiklikleri ve içsel arzuları.',
          content: 'Güneş her zamanki gibi doğuyordu...',
        },
        {
          id: 'node-ch-2',
          title: 'Bölüm 2: Maceraya Çağrı ve Kırılma Noktası',
          type: 'document',
          synopsis: 'Dengeyi bozan beklenmedik olay veya gizemli haberci.',
          content: 'Gelen mektup her şeyi sonsuza dek değiştirecekti...',
        },
      ],
    },
    {
      id: 'node-act-2',
      title: '2. Perde: Çatışma ve Sınavlar',
      type: 'folder',
      synopsis: 'Kahramanın yeni dünyaya girişi, müttefikler, düşmanlar ve orta nokta (Midpoint).',
      children: [
        {
          id: 'node-ch-3',
          title: 'Bölüm 3: İlk Engeller ve Dostlar',
          type: 'document',
          synopsis: 'Yeni kurallar, testler ve ekibin toplanması.',
          content: 'Şehrin yabancı sokaklarında yolunu bulmaya çalışırken...',
        },
        {
          id: 'node-ch-4',
          title: 'Bölüm 4: Orta Nokta (Geri Dönüşü Olmayan An)',
          type: 'document',
          synopsis: 'Büyük sırrın açığa çıkması veya riskin katlanması.',
          content: 'Artık geriye dönüş yoktu. Köprüler yakılmıştı...',
        },
        {
          id: 'node-ch-5',
          title: 'Bölüm 5: Ruhun Karanlık Gecesi (Dibe Vuruş)',
          type: 'document',
          synopsis: 'Büyük kayıp veya tüm umutların tükendiği kriz anı.',
          content: 'Her şeyin bittiğini düşündüğü o karanlık odada...',
        },
      ],
    },
    {
      id: 'node-act-3',
      title: '3. Perde: Çözüm ve Doruk Noktası (Klimaks)',
      type: 'folder',
      synopsis: 'Son hesaplaşma, içsel dönüşüm ve yeni dengenin kurulması.',
      children: [
        {
          id: 'node-ch-6',
          title: 'Bölüm 6: Büyük Hesaplaşma (Klimaks)',
          type: 'document',
          synopsis: 'Kahraman ile antagonist arasındaki yüzleşme.',
          content: 'Fırtına en yüksek şiddetine ulaştığında iki rakip göz göze geldi...',
        },
        {
          id: 'node-ch-7',
          title: 'Bölüm 7: Yeni Denge ve Kapanış',
          type: 'document',
          synopsis: 'Karakterin kazandığı ders ve geleceğe bakış.',
          content: 'Toz duman dindiğinde dünya artık eskisi gibi değildi...',
        },
      ],
    },
    {
      id: 'node-research-characters',
      title: 'Karakterler & Story Bible',
      type: 'folder',
      children: [
        {
          id: 'node-char-protagonist',
          title: 'Başkahraman Dosyası',
          type: 'document',
          synopsis: 'Karakter motivasyonu, kusurları, çatışmaları ve biyografisi.',
          content: '# Karakter: Başkahraman\n\n- Yaş:\n- Meslek:\n- Temel Arzu:\n- İçsel Yara:\n',
        },
        {
          id: 'node-char-antagonist',
          title: 'Antagonist (Karşı Güç)',
          type: 'document',
          synopsis: 'Karşıt gücün motivasyonu, haklı gördüğü nedenler.',
          content: '# Karakter: Antagonist\n\n- Neden bu yola girdi?\n- Güçlü Yönleri:\n',
        },
      ],
    },
  ],
};
