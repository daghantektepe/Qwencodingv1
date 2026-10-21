import { ProjectTemplate } from '../../types/templates';

export const academicPreset: ProjectTemplate = {
  id: 'preset-academic-thesis',
  name: 'Akademik Tez ve Araştırma Makalesi',
  category: 'academic',
  description:
    'Yüksek lisans, doktora tezleri ve bilimsel makaleler için standart IMRAD (Introduction, Methods, Results, and Discussion) ve kaynakça yapısı.',
  icon: '🎓',
  targetAudience: 'Akademisyenler, araştırmacılar ve lisansüstü öğrencileri',
  version: '1.0.0',
  targets: {
    totalWords: 35000,
  },
  rootNodes: [
    {
      id: 'node-acad-preface',
      title: 'Ön Bölümler',
      type: 'folder',
      children: [
        {
          id: 'node-abstract',
          title: 'Özet (Abstract)',
          type: 'document',
          synopsis: 'Araştırmanın amacı, yöntemi, temel bulguları ve katkısı.',
          content: '## Özet\n\nBu çalışma...\n\n**Anahtar Kelimeler:** ',
        },
        {
          id: 'node-acknowledgements',
          title: 'Teşekkür ve İthaf',
          type: 'document',
          content: 'Tez danışmanıma ve katkı sunan kurumlara teşekkür ederim.',
        },
      ],
    },
    {
      id: 'node-acad-intro',
      title: '1. Giriş ve Araştırma Problemi',
      type: 'document',
      synopsis: 'Araştırma sorusu, hipotezler, çalışmanın önemi ve sınırlılıkları.',
      content: '# 1. Giriş\n\nBu araştırmanın temel sorunsalı...\n',
    },
    {
      id: 'node-acad-lit-review',
      title: '2. Literatür Taraması (Kavramsal Çerçeve)',
      type: 'document',
      synopsis: 'Konuyla ilgili daha önce yapılmış öncü çalışmaların eleştirel değerlendirmesi.',
      content: '# 2. Literatür Taraması\n\nGeçmiş çalışmalar incelendiğinde...\n',
    },
    {
      id: 'node-acad-methods',
      title: '3. Metodoloji ve Veri Toplama',
      type: 'document',
      synopsis: 'Evren-örneklem, veri toplama araçları, etik kurul onayları ve analiz modeli.',
      content: '# 3. Metodoloji\n\nAraştırma nicel/nitel desende tasarlanmıştır...\n',
    },
    {
      id: 'node-acad-results',
      title: '4. Bulgular ve Veri Analizi',
      type: 'document',
      synopsis: 'İstatistiki veya tematik analiz sonuçları, tablolar ve grafikler.',
      content: '# 4. Bulgular\n\nElde edilen verilerin analizi sonucunda...\n',
    },
    {
      id: 'node-acad-discussion',
      title: '5. Tartışma ve Sonuç',
      type: 'document',
      synopsis: 'Bulguların literatürle kıyası, teorik ve pratik katkılar, geleceğe yönelik öneriler.',
      content: '# 5. Tartışma ve Sonuç\n\nÇalışmadan elde edilen bulgular doğrultusunda...\n',
    },
    {
      id: 'node-acad-references',
      title: 'Kaynakça ve Ekler',
      type: 'folder',
      children: [
        {
          id: 'node-bibliography',
          title: 'Kaynakça (APA / Chicago)',
          type: 'document',
          content: '# Kaynakça\n\n[1] Smith, J. (2024)...\n',
        },
        {
          id: 'node-appendices',
          title: 'Ekler (Anketler, Ham Veriler)',
          type: 'document',
          content: '# Ek 1: Veri Toplama Formu\n',
        },
      ],
    },
  ],
};
