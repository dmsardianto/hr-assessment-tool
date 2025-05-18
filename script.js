// Konfigurasi
const scriptURL = 'https://script.google.com/macros/s/AKfycbwDKUjSdNAlELUqrjHD-a7cy122m8av7E37hSInugQAHGTyfZBDWbW94-E3QPVKaqkc/exec';

const weights = {
  HR: {
    Freshgraduate: {
      "Antusias": 0.20,
      "Customer Service": 0.03,
      "Komunikasi Lisan": 0.20,
      "Kualifikasi Teknis": 0.17,
      "Pendidikan": 0.20,
      "Manajemen Waktu": 0.05,
      "Personal Branding": 0.05,
      "Problem Solving": 0.05,
      "Teamwork": 0.05
    },
    Experience: {
      "Antusias": 0.15,
      "Customer Service": 0.10,
      "Komunikasi Lisan": 0.20,
      "Kualifikasi Teknis": 0.25,
      "Manajemen Waktu": 0.05,
      "Personal Branding": 0.05,
      "Problem Solving": 0.10,
      "Teamwork": 0.10
    },
    KeyPerson: {
      "Antusias": 0.10,
      "Customer Service": 0.05,
      "Komunikasi Lisan": 0.20,
      "Kualifikasi Teknis": 0.10,
      "Manajemen Waktu": 0.15,
      "Personal Branding": 0.05,
      "Problem Solving": 0.15,
      "Teamwork": 0.20
    }
  },
  User: {
    Freshgraduate: {
      "Antusias": 0.10,
      "Komunikasi Lisan": 0.30,
      "Kualifikasi dan Pengalaman Teknis": 0.15,
      "Latar Belakang Pendidikan": 0.30,
      "Manajemen Waktu": 0.10,
      "Personal Branding": 0.05
    },
    Experience: {
      "Antusias": 0.10,
      "Komunikasi Lisan": 0.20,
      "Kualifikasi dan Pengalaman Teknis": 0.30,
      "Manajemen Waktu": 0.10,
      "Personal Branding": 0.10,
      "Problem Solving": 0.10,
      "Teambuilding": 0.10
    },
    KeyPerson: {
      "Antusias": 0.10,
      "Komunikasi Lisan": 0.20,
      "Kualifikasi dan Pengalaman Teknis": 0.15,
      "Manajemen Waktu": 0.10,
      "Personal Branding": 0.05,
      "Problem Solving": 0.20,
      "Teambuilding": 0.20
    }
  }
};

let radarChart = null;
let currentAssessment = {};

document.addEventListener('DOMContentLoaded', () => {
  // Inisialisasi tanggal
  document.getElementById('interviewDate').value = new Date().toISOString().split('T')[0];
  
  // Event listeners untuk update form
  document.getElementById('interviewerRole').addEventListener('change', updateForm);
  document.getElementById('candidateLevel').addEventListener('change', updateForm);
  
  // Event listener submit form
  document.getElementById('assessmentForm').addEventListener('submit', handleSubmit);
  
  // Inisialisasi pertama
  updateForm();
});

function updateForm() {
  const role = document.getElementById('interviewerRole').value;
  const level = document.getElementById('candidateLevel').value;
  const section = document.getElementById('scoreSection');
  
  section.innerHTML = '';
  
  if (weights[role] && weights[role][level]) {
    Object.entries(weights[role][level]).forEach(([category, weight]) => {
      const inputId = category.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      section.innerHTML += `
        <div class="form-group">
          <label for="${inputId}">${category} (${(weight * 100).toFixed(0)}%)</label>
          <input type="number" 
                 id="${inputId}"
                 min="1" 
                 max="10" 
                 data-category="${category}" 
                 required
                 class="score-input">
        </div>
      `;
    });
    
    // Tambahkan event listener ke input
    document.querySelectorAll('.score-input').forEach(input => {
      input.addEventListener('input', function() {
        if (this.value < 1) this.value = 1;
        if (this.value > 10) this.value = 10;
      });
    });
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  
  // Validasi role dan level
  const role = document.getElementById('interviewerRole').value;
  const level = document.getElementById('candidateLevel').value;
  
  if (!role || !level) {
    alert('Pilih Role dan Level terlebih dahulu!');
    return;
  }

  // Kumpulkan data
  const assessment = {
    date: document.getElementById('interviewDate').value,
    interviewer: document.getElementById('interviewerName').value,
    role: role,
    candidate: document.getElementById('candidateName').value,
    level: level,
    scores: {}
  };

  // Validasi input skor
  let isValid = true;
  document.querySelectorAll('.score-input').forEach(input => {
    const value = parseFloat(input.value);
    if (isNaN(value) || value < 1 || value > 10) {
      isValid = false;
      input.classList.add('error');
    } else {
      input.classList.remove('error');
    }
  });

  if (!isValid) {
    alert('Semua skor harus diisi dengan angka 1-10!');
    return;
  }

  // Hitung total skor
  let total = 0;
  document.querySelectorAll('.score-input').forEach(input => {
    const category = input.dataset.category;
    const score = parseFloat(input.value);
    const weight = weights[assessment.role][assessment.level][category];
    
    assessment.scores[category] = score;
    total += score * weight * 10;
  });

  // Simpan data
  currentAssessment = {
    ...assessment,
    total: total.toFixed(2),
    status: total >= 70 ? 'LULUS' : 'TIDAK LULUS'
  };

  // Tampilkan hasil
  showResult();
  
  // Kirim ke Google Sheets
  try {
    const response = await fetch(`${scriptURL}?redirect=please`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        tanggal: currentAssessment.date,
        interviewer: currentAssessment.interviewer,
        role: currentAssessment.role,
        kandidat: currentAssessment.candidate,
        level: currentAssessment.level,
        total: currentAssessment.total,
        status: currentAssessment.status
      })
    });

    if (!response.ok) throw new Error(`Gagal menyimpan: ${response.statusText}`);
    
    const result = await response.json();
    console.log('Sukses:', result);
    alert('Data tersimpan ke Google Sheet!');
    
  } catch (error) {
    console.error('Error:', error);
    alert('Gagal menyimpan. Silakan coba lagi atau cek koneksi internet!');
  }
}

function showResult() {
  const resultContainer = document.getElementById('resultContainer');
  resultContainer.classList.remove('hidden');
  document.getElementById('finalScore').textContent = currentAssessment.total;
  document.getElementById('resultStatus').textContent = currentAssessment.status;
  
  renderChart();
  resultContainer.scrollIntoView({ behavior: 'smooth' });
}

function renderChart() {
  if (radarChart) radarChart.destroy();
  
  const ctx = document.getElementById('radarChart').getContext('2d');
  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: Object.keys(currentAssessment.scores),
      datasets: [{
        label: 'Kompetensi Kandidat',
        data: Object.values(currentAssessment.scores),
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        borderColor: '#3498db',
        pointBackgroundColor: '#3498db',
        pointRadius: 4
      }]
    },
    options: {
      scales: {
        r: {
          beginAtZero: false,
          min: 1,
          max: 10,
          ticks: {
            stepSize: 1,
            showLabelBackdrop: false,
            callback: value => Number.isInteger(value) ? value : null
          },
          angleLines: { color: 'rgba(0, 0, 0, 0.1)' },
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          pointLabels: { font: { size: 12 } }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.text("Laporan Hasil Assessment", 105, 20, { align: 'center' });
  
  // Informasi kandidat
  doc.setFontSize(12);
  doc.text(`Nama Kandidat: ${currentAssessment.candidate}`, 20, 30);
  doc.text(`Level: ${currentAssessment.level}`, 20, 36);
  doc.text(`Interviewer: ${currentAssessment.interviewer}`, 20, 42);
  doc.text(`Tanggal: ${currentAssessment.date}`, 20, 48);
  
  // Tabel skor
  doc.autoTable({
    startY: 60,
    head: [['Kategori', 'Skor', 'Bobot', 'Skor Terbobot']],
    body: Object.entries(currentAssessment.scores).map(([kategori, skor]) => [
      kategori,
      skor,
      `${(weights[currentAssessment.role][currentAssessment.level][kategori] * 100).toFixed(0)}%`,
      (skor * weights[currentAssessment.role][currentAssessment.level][kategori] * 10).toFixed(2)
    ]),
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });

  // Simpan PDF
  doc.save(`Hasil_Assessment_${currentAssessment.candidate}.pdf`);
}
