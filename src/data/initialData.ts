import { Student, ClassInfo, GradeItem } from '../types';

export const initialClassInfo: ClassInfo = {
  schoolName: 'SMP Negeri 1 Bintang Harapan',
  className: 'Kelas VIII-B',
  academicYear: '2024/2025',
  semester: 'Genap',
  teacherName: 'Dra. Hj. Siti Rahmawati, M.Pd.',
  teacherNip: '19790514 200501 2 006',
  teacherPhone: '081298765432',
  teacherEmail: 'siti.rahmawati@smpn1bintang.sch.id',
  announcement: 'Pengumuman: Pertemuan Wali Murid Semester Genap akan dilaksanakan pada Sabtu, 18 Mei 2025 pukul 09.00 WIB di Aula Sekolah.',
  headmasterName: 'Drs. H. Mulyadi, M.Pd.',
  headmasterNip: '19680812 199303 1 005',
  schoolCity: 'Bandung',
  schoolAddress: 'Jl. Pendidikan Bintang No. 45, Telp. (022) 7654321, Website: smpn1bintang.sch.id',
};

export const defaultSubjects = [
  'Pendidikan Agama & Budi Pekerti',
  'Pancasila & Kewarganegaraan',
  'Bahasa Indonesia',
  'Matematika',
  'Ilmu Pengetahuan Alam (IPA)',
  'Ilmu Pengetahuan Sosial (IPS)',
  'Bahasa Inggris',
  'Seni Budaya',
  'Pendidikan Jasmani (PJOK)',
  'Informatika',
];

export function calculateGrade(
  uh1: number | null | undefined,
  uh2: number | null | undefined,
  tugas: number | null | undefined,
  uts: number | null | undefined,
  uas: number | null | undefined
): { average: number | null; letterGrade: 'A' | 'B' | 'C' | 'D' | '-' } {
  // Hanya nilai yang sudah diinput yang ikut dihitung bobot dan rata-ratanya!
  let weightedSum = 0;
  let totalWeight = 0;

  if (typeof uh1 === 'number' && !isNaN(uh1)) {
    weightedSum += uh1;
    totalWeight += 1;
  }
  if (typeof uh2 === 'number' && !isNaN(uh2)) {
    weightedSum += uh2;
    totalWeight += 1;
  }
  if (typeof tugas === 'number' && !isNaN(tugas)) {
    weightedSum += tugas;
    totalWeight += 1;
  }
  if (typeof uts === 'number' && !isNaN(uts)) {
    weightedSum += uts * 2;
    totalWeight += 2;
  }
  if (typeof uas === 'number' && !isNaN(uas)) {
    weightedSum += uas * 2;
    totalWeight += 2;
  }

  if (totalWeight === 0) {
    return { average: null, letterGrade: '-' };
  }

  const avg = Math.round(weightedSum / totalWeight);
  let letterGrade: 'A' | 'B' | 'C' | 'D' | '-' = 'D';
  if (avg >= 88) letterGrade = 'A';
  else if (avg >= 78) letterGrade = 'B';
  else if (avg >= 68) letterGrade = 'C';
  return { average: avg, letterGrade };
}

export function createGradeItem(
  subject: string,
  uh1: number | null = null,
  uh2: number | null = null,
  tugas: number | null = null,
  uts: number | null = null,
  uas: number | null = null,
  kkm = 75
): GradeItem {
  const { average, letterGrade } = calculateGrade(uh1, uh2, tugas, uts, uas);
  return {
    id: `subj-${Math.random().toString(36).substring(2, 9)}`,
    subject,
    kkm,
    uh1,
    uh2,
    tugas,
    uts,
    uas,
    average,
    letterGrade,
  };
}

export const initialStudents: Student[] = [
  {
    id: 'std-1',
    nis: '23240801',
    nisn: '0098471231',
    name: 'Ahmad Fauzan Pratama',
    gender: 'L',
    parentName: 'Bambang Supriyanto',
    parentPhone: '081234567891',
    studentPhone: '082199887711',
    address: 'Jl. Merpati No. 12, RT 02/04, Kelurahan Harapan Baru',
    teacherNote: 'Ahmad merupakan siswa yang aktif dan antusias dalam pembelajaran IPA dan Matematika. Sangat sopan dan disukai rekan sekelasnya. Tingkatkan konsistensi pengumpulan tugas harian.',
    attendance: {
      sakit: 1,
      izin: 1,
      alpha: 0,
      totalEffectiveDays: 90,
      entries: [
        { id: 'att-1', date: '2025-01-16', status: 'sakit', note: 'Flu dan demam tinggi, ada surat dokter dari Puskesmas Harapan' },
        { id: 'att-2', date: '2025-02-03', status: 'izin', note: 'Izin menghadiri pernikahan saudara di Bandung (surat orang tua)' },
      ],
    },
    grades: [
      createGradeItem('Pendidikan Agama & Budi Pekerti', 88, 90, 85, 90, 92, 75),
      createGradeItem('Pancasila & Kewarganegaraan', 82, 85, 80, 84, 86, 75),
      createGradeItem('Bahasa Indonesia', 85, 88, 86, 88, 90, 75),
      createGradeItem('Matematika', 90, 95, 92, 94, 96, 75),
      createGradeItem('Ilmu Pengetahuan Alam (IPA)', 92, 90, 94, 95, 92, 75),
      createGradeItem('Ilmu Pengetahuan Sosial (IPS)', 80, 82, 85, 84, 82, 75),
      createGradeItem('Bahasa Inggris', 85, 88, 84, 86, 88, 75),
      createGradeItem('Seni Budaya', 80, 85, 85, 82, 84, 75),
      createGradeItem('Pendidikan Jasmani (PJOK)', 88, 90, 86, 88, 90, 75),
      createGradeItem('Informatika', 95, 98, 96, 95, 98, 75),
    ],
    infractions: [],
    achievements: [
      {
        id: 'ach-1',
        date: '2025-02-14',
        title: 'Juara 1 Olimpiade Sains Nasional (OSN) Tingkat Kota Bidang IPA',
        level: 'Kota/Kab',
        ranking: 'Juara 1',
        description: 'Mewakili sekolah ke tingkat Provinsi dengan skor tes tertinggi.',
      },
      {
        id: 'ach-2',
        date: '2024-11-20',
        title: 'Juara 2 Lomba Cerdas Cermat Pelajar Hebat',
        level: 'Kecamatan',
        ranking: 'Juara 2',
        description: 'Tim Cerdas Cermat gabungan kelas VIII.',
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'std-2',
    nis: '23240802',
    nisn: '0098471232',
    name: 'Aisyah Putri Maharani',
    gender: 'P',
    parentName: 'Hendro Setiawan, S.E.',
    parentPhone: '081345678902',
    studentPhone: '082233445566',
    address: 'Perum Bintang Asri Blok C4 No. 8',
    teacherNote: 'Aisyah sangat berbakat dalam bidang bahasa dan seni bertutur. Memiliki jiwa kepemimpinan sebagai bendahara kelas yang amanah. Pertahankan prestasi gemilang ini!',
    attendance: {
      sakit: 0,
      izin: 0,
      alpha: 0,
      totalEffectiveDays: 90,
      entries: [],
    },
    grades: [
      createGradeItem('Pendidikan Agama & Budi Pekerti', 94, 96, 95, 96, 98, 75),
      createGradeItem('Pancasila & Kewarganegaraan', 90, 92, 90, 92, 94, 75),
      createGradeItem('Bahasa Indonesia', 96, 95, 98, 96, 98, 75),
      createGradeItem('Matematika', 86, 88, 85, 87, 89, 75),
      createGradeItem('Ilmu Pengetahuan Alam (IPA)', 88, 90, 92, 89, 91, 75),
      createGradeItem('Ilmu Pengetahuan Sosial (IPS)', 92, 94, 95, 93, 95, 75),
      createGradeItem('Bahasa Inggris', 95, 96, 94, 97, 98, 75),
      createGradeItem('Seni Budaya', 92, 90, 95, 92, 94, 75),
      createGradeItem('Pendidikan Jasmani (PJOK)', 84, 85, 88, 86, 88, 75),
      createGradeItem('Informatika', 90, 92, 90, 94, 95, 75),
    ],
    infractions: [],
    achievements: [
      {
        id: 'ach-3',
        date: '2025-01-28',
        title: 'Juara 1 Lomba Storytelling Bahasa Inggris Festival Literasi',
        level: 'Kota/Kab',
        ranking: 'Juara 1',
        description: 'Membawakan cerita rakyat Malin Kundang dengan pelafalan sangat fasih.',
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'std-3',
    nis: '23240803',
    nisn: '0098471233',
    name: 'Bima Arya Nugraha',
    gender: 'L',
    parentName: 'Drs. Agus Nugraha',
    parentPhone: '081298112233',
    studentPhone: '085711223344',
    address: 'Jl. Melati Indah No. 45',
    teacherNote: 'Bima memiliki fisik prima dan bakat olahraga yang luar biasa. Perlu sedikit dorongan motivasi dalam pelajaran hafalan seperti IPS dan PPKn.',
    attendance: {
      sakit: 2,
      izin: 2,
      alpha: 1,
      totalEffectiveDays: 90,
      entries: [
        { id: 'att-3', date: '2025-01-10', status: 'sakit', note: 'Cedera ringan kaki saat latihan pencak silat' },
        { id: 'att-4', date: '2025-01-11', status: 'sakit', note: 'Masa istirahat pemulihan sesuai petunjuk dokter' },
        { id: 'att-5', date: '2025-01-25', status: 'izin', note: 'Mengikuti seleksi turnamen silat daerah' },
        { id: 'att-6', date: '2025-02-12', status: 'izin', note: 'Keperluan penting keluarga di luar kota' },
        { id: 'att-7', date: '2025-02-20', status: 'alpha', note: 'Tidak masuk tanpa kabar atau surat izin' },
      ],
    },
    grades: [
      createGradeItem('Pendidikan Agama & Budi Pekerti', 78, 80, 82, 80, 82, 75),
      createGradeItem('Pancasila & Kewarganegaraan', 74, 76, 75, 76, 77, 75),
      createGradeItem('Bahasa Indonesia', 78, 80, 82, 80, 83, 75),
      createGradeItem('Matematika', 75, 74, 76, 75, 78, 75),
      createGradeItem('Ilmu Pengetahuan Alam (IPA)', 78, 76, 80, 78, 80, 75),
      createGradeItem('Ilmu Pengetahuan Sosial (IPS)', 74, 75, 75, 76, 77, 75),
      createGradeItem('Bahasa Inggris', 76, 78, 80, 78, 82, 75),
      createGradeItem('Seni Budaya', 80, 82, 85, 84, 85, 75),
      createGradeItem('Pendidikan Jasmani (PJOK)', 98, 96, 98, 98, 100, 75),
      createGradeItem('Informatika', 80, 82, 84, 82, 85, 75),
    ],
    infractions: [
      {
        id: 'inf-1',
        date: '2025-02-05',
        title: 'Terlambat masuk sekolah > 15 menit',
        category: 'Ringan',
        points: 5,
        penalty: 'Piket kebersihan perpustakaan & pembinaan wali kelas',
        resolved: true,
        notes: 'Alasan ban motor kempes. Sudah diberi teguran dan tidak mengulangi.',
      },
    ],
    achievements: [
      {
        id: 'ach-4',
        date: '2024-12-10',
        title: 'Medali Emas Kejuaraan Pencak Silat Antar Pelajar Daerah',
        level: 'Provinsi',
        ranking: 'Medali Emas',
        description: 'Kategori Tanding Remaja Kelas D Putra.',
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'std-4',
    nis: '23240804',
    nisn: '0098471234',
    name: 'Cantika Dewi Lestari',
    gender: 'P',
    parentName: 'Dewi Sartika',
    parentPhone: '081399881122',
    address: 'Jl. Kenanga No. 19 RT 01/02',
    teacherNote: 'Cantika siswa yang tekun dan teliti. Tulisan rapi dan catatan buku pelajaran sangat lengkap. Rekan-rekan sering meminjam catatannya.',
    attendance: {
      sakit: 1,
      izin: 0,
      alpha: 0,
      totalEffectiveDays: 90,
      entries: [
        { id: 'att-8', date: '2025-01-22', status: 'sakit', note: 'Sakit gigi dan radang gusi, kontrol ke dokter gigi' },
      ],
    },
    grades: [
      createGradeItem('Pendidikan Agama & Budi Pekerti', 90, 92, 90, 92, 94, 75),
      createGradeItem('Pancasila & Kewarganegaraan', 88, 90, 88, 90, 92, 75),
      createGradeItem('Bahasa Indonesia', 92, 94, 95, 92, 95, 75),
      createGradeItem('Matematika', 82, 85, 84, 86, 88, 75),
      createGradeItem('Ilmu Pengetahuan Alam (IPA)', 85, 88, 86, 88, 90, 75),
      createGradeItem('Ilmu Pengetahuan Sosial (IPS)', 88, 90, 92, 90, 92, 75),
      createGradeItem('Bahasa Inggris', 88, 90, 88, 92, 92, 75),
      createGradeItem('Seni Budaya', 94, 96, 95, 96, 98, 75),
      createGradeItem('Pendidikan Jasmani (PJOK)', 85, 84, 88, 85, 86, 75),
      createGradeItem('Informatika', 86, 88, 90, 88, 90, 75),
    ],
    infractions: [],
    achievements: [
      {
        id: 'ach-5',
        date: '2025-01-15',
        title: 'Juara 2 Lomba Melukis Kaligrafi Islam Tingkat Sekolah',
        level: 'Sekolah',
        ranking: 'Juara 2',
        description: 'Peringatan Isra Miraj di Masjid Sekolah.',
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'std-5',
    nis: '23240805',
    nisn: '0098471235',
    name: 'Dimas Bagus Ramadhan',
    gender: 'L',
    parentName: 'Kurniawan Pratama',
    parentPhone: '085211223399',
    studentPhone: '085299881100',
    address: 'Jl. Flamboyan Timur No. 7',
    teacherNote: 'Dimas memiliki potensi analitis yang bagus. Namun perlu bimbingan orang tua di rumah untuk mengurangi waktu bermain gadget agar tidak terlambat bangun pagi.',
    attendance: {
      sakit: 3,
      izin: 1,
      alpha: 2,
      totalEffectiveDays: 90,
      entries: [
        { id: 'att-9', date: '2025-01-14', status: 'sakit', note: 'Gejala tifus dan demam tinggi, rawat jalan klinik' },
        { id: 'att-10', date: '2025-01-15', status: 'sakit', note: 'Istirahat di rumah hari ke-2 (surat dokter)' },
        { id: 'att-11', date: '2025-01-16', status: 'sakit', note: 'Istirahat di rumah hari ke-3' },
        { id: 'att-12', date: '2025-02-04', status: 'izin', note: 'Izin menghadiri pernikahan kerabat di Solo' },
        { id: 'att-13', date: '2025-02-17', status: 'alpha', note: 'Bangun kesiangan dan tidak masuk sekolah tanpa surat' },
        { id: 'att-14', date: '2025-02-28', status: 'alpha', note: 'Tidak hadir tanpa keterangan' },
      ],
    },
    grades: [
      createGradeItem('Pendidikan Agama & Budi Pekerti', 76, 78, 80, 78, 80, 75),
      createGradeItem('Pancasila & Kewarganegaraan', 72, 74, 75, 74, 75, 75),
      createGradeItem('Bahasa Indonesia', 78, 80, 78, 80, 82, 75),
      createGradeItem('Matematika', 80, 82, 78, 82, 85, 75),
      createGradeItem('Ilmu Pengetahuan Alam (IPA)', 78, 80, 82, 80, 84, 75),
      createGradeItem('Ilmu Pengetahuan Sosial (IPS)', 74, 76, 75, 75, 78, 75),
      createGradeItem('Bahasa Inggris', 76, 78, 80, 78, 80, 75),
      createGradeItem('Seni Budaya', 78, 80, 82, 80, 82, 75),
      createGradeItem('Pendidikan Jasmani (PJOK)', 82, 84, 85, 85, 88, 75),
      createGradeItem('Informatika', 88, 90, 88, 92, 92, 75),
    ],
    infractions: [
      {
        id: 'inf-2',
        date: '2025-01-20',
        title: 'Tidak mengerjakan PR Matematika 2x berturut-turut',
        category: 'Ringan',
        points: 5,
        penalty: 'Menyelesaikan soal tambahan saat istirahat dengan bimbingan guru mapel',
        resolved: true,
        notes: 'Sudah menyelesaikan semua tugas dan berjanji akan mengumpulkan tepat waktu.',
      },
      {
        id: 'inf-3',
        date: '2025-02-18',
        title: 'Membawa HP saat jam pelajaran tanpa izin',
        category: 'Sedang',
        points: 10,
        penalty: 'Penyimpanan HP di ruang BP/BK selama 3 hari & surat pemberitahuan orang tua',
        resolved: false,
        notes: 'Orang tua telah dihubungi via WhatsApp untuk pendampingan bersama.',
      },
    ],
    achievements: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'std-6',
    nis: '23240806',
    nisn: '0098471236',
    name: 'Fadhil Muhammad Ridwan',
    gender: 'L',
    parentName: 'Ridwan Kamiludin',
    parentPhone: '081277665544',
    address: 'Jl. Dahlia No. 8B, Sukajadi',
    teacherNote: 'Fadhil sangat ceria dan suka menolong. Memiliki kemampuan komunikasi yang baik di depan umum. Perlu sedikit lebih tenang saat jam pelajaran berlangsung.',
    attendance: {
      sakit: 1,
      izin: 2,
      alpha: 0,
      totalEffectiveDays: 90,
      entries: [
        { id: 'att-15', date: '2025-01-18', status: 'sakit', note: 'Batuk dan radang tenggorokan' },
        { id: 'att-16', date: '2025-02-06', status: 'izin', note: 'Urusan keluarga di Cirebon (surat dari orang tua)' },
        { id: 'att-17', date: '2025-02-07', status: 'izin', note: 'Urusan keluarga hari ke-2' },
      ],
    },
    grades: [
      createGradeItem('Pendidikan Agama & Budi Pekerti', 84, 85, 86, 85, 88, 75),
      createGradeItem('Pancasila & Kewarganegaraan', 80, 82, 84, 82, 85, 75),
      createGradeItem('Bahasa Indonesia', 86, 88, 85, 88, 90, 75),
      createGradeItem('Matematika', 78, 80, 82, 82, 84, 75),
      createGradeItem('Ilmu Pengetahuan Alam (IPA)', 80, 82, 80, 84, 85, 75),
      createGradeItem('Ilmu Pengetahuan Sosial (IPS)', 82, 85, 86, 84, 88, 75),
      createGradeItem('Bahasa Inggris', 84, 86, 85, 88, 88, 75),
      createGradeItem('Seni Budaya', 82, 84, 85, 85, 86, 75),
      createGradeItem('Pendidikan Jasmani (PJOK)', 90, 92, 90, 92, 94, 75),
      createGradeItem('Informatika', 85, 88, 86, 88, 90, 75),
    ],
    infractions: [],
    achievements: [
      {
        id: 'ach-6',
        date: '2024-10-28',
        title: 'Juara 3 Lomba Pidato Hari Sumpah Pemuda Antar Kelas',
        level: 'Sekolah',
        ranking: 'Juara 3',
        description: 'Pidato bertema Peran Pemuda di Era Digital.',
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'std-7',
    nis: '23240807',
    nisn: '0098471237',
    name: 'Gita Safira Wardani',
    gender: 'P',
    parentName: 'Ir. Wardani Hidayat',
    parentPhone: '081388776655',
    studentPhone: '081388776656',
    address: 'Komp. Graha Indah Blok A No. 15',
    teacherNote: 'Gita siswi yang mandiri, berprestasi konsisten, dan selalu membantu teman yang kesulitan memahami materi matematika. Calon pemimpin masa depan!',
    attendance: {
      sakit: 0,
      izin: 1,
      alpha: 0,
      totalEffectiveDays: 90,
      entries: [
        { id: 'att-18', date: '2025-02-11', status: 'izin', note: 'Mendampingi orang tua kontrol kesehatan di RS Hasan Sadikin' },
      ],
    },
    grades: [
      createGradeItem('Pendidikan Agama & Budi Pekerti', 92, 94, 92, 95, 96, 75),
      createGradeItem('Pancasila & Kewarganegaraan', 90, 92, 90, 92, 94, 75),
      createGradeItem('Bahasa Indonesia', 90, 92, 94, 92, 95, 75),
      createGradeItem('Matematika', 94, 96, 95, 98, 98, 75),
      createGradeItem('Ilmu Pengetahuan Alam (IPA)', 95, 96, 94, 96, 98, 75),
      createGradeItem('Ilmu Pengetahuan Sosial (IPS)', 88, 90, 92, 90, 94, 75),
      createGradeItem('Bahasa Inggris', 92, 94, 92, 95, 96, 75),
      createGradeItem('Seni Budaya', 88, 90, 92, 90, 92, 75),
      createGradeItem('Pendidikan Jasmani (PJOK)', 86, 88, 90, 88, 90, 75),
      createGradeItem('Informatika', 96, 98, 98, 98, 100, 75),
    ],
    infractions: [],
    achievements: [
      {
        id: 'ach-7',
        date: '2025-02-10',
        title: 'Juara Harapan 1 Lomba Cipta Puisi Pelajar',
        level: 'Kota/Kab',
        ranking: 'Juara Harapan 1',
        description: 'Karya puisi berjudul Lentera Pengabdian Guru.',
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'std-8',
    nis: '23240808',
    nisn: '0098471238',
    name: 'Hafiz Al-Ghifari',
    gender: 'L',
    parentName: 'Dra. Nurhayati',
    parentPhone: '081299001122',
    address: 'Jl. Anggrek No. 24, Sukamaju',
    teacherNote: 'Hafiz memiliki ketenangan dan sopan santun yang patut diteladani. Hafalan Al-Quran juz 30 sangat lancar. Terus pertahankan akhlak mulia ini.',
    attendance: {
      sakit: 1,
      izin: 0,
      alpha: 0,
      totalEffectiveDays: 90,
      entries: [
        { id: 'att-19', date: '2025-01-30', status: 'sakit', note: 'Demam meriang dan flu, istirahat di rumah' },
      ],
    },
    grades: [
      createGradeItem('Pendidikan Agama & Budi Pekerti', 98, 96, 98, 98, 100, 75),
      createGradeItem('Pancasila & Kewarganegaraan', 88, 90, 88, 90, 92, 75),
      createGradeItem('Bahasa Indonesia', 86, 88, 85, 88, 90, 75),
      createGradeItem('Matematika', 84, 85, 88, 86, 88, 75),
      createGradeItem('Ilmu Pengetahuan Alam (IPA)', 85, 86, 88, 87, 89, 75),
      createGradeItem('Ilmu Pengetahuan Sosial (IPS)', 86, 88, 85, 88, 90, 75),
      createGradeItem('Bahasa Inggris', 84, 85, 86, 86, 88, 75),
      createGradeItem('Seni Budaya', 82, 85, 84, 85, 88, 75),
      createGradeItem('Pendidikan Jasmani (PJOK)', 85, 86, 88, 86, 88, 75),
      createGradeItem('Informatika', 88, 90, 88, 90, 92, 75),
    ],
    infractions: [],
    achievements: [
      {
        id: 'ach-8',
        date: '2024-11-15',
        title: 'Juara 1 Musabaqah Hifzhil Quran (MHQ) 3 Juz',
        level: 'Kota/Kab',
        ranking: 'Juara 1',
        description: 'Kategori Tilawah dan Hifzhil Quran SMP tingkat kota.',
      },
    ],
    updatedAt: new Date().toISOString(),
  },
];
