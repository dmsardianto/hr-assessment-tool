// Konfigurasi
const scriptURL = 'https://script.google.com/macros/s/AKfycbwx7i8gUU1Tu8hQHmQSzdn6Wp89qroVkoZsKHjU4zIhOiaqj4_gMP1RIXMTxq3m0DsR/exec';

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

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('interviewDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('interviewerRole').addEventListener('change', updateForm);
  document.getElementById('candidateLevel').addEventListener('change', updateForm);
  document.getElementById('assessmentForm').addEventListener('submit', handleSubmit);
});

function updateForm() {
  const role = document.getElementById('interviewerRole').value;
  const level = document.getElementById('candidateLevel').value;
  const section = document.getElementById('scoreSection');
  
  section.innerHTML = '';
  
  if (weights[role]?.[level]) {
    Object.entries(weights[role][level]).forEach(([category, weight]) => {
      section.innerHTML += `
        <div class="form-group">
          <label>${category} (${(weight * 100).toFixed(0)}%)</label>
          <input type="number" 
                 min="1" 
                 max="10" 
                 data-category="${category}" 
                 required>
        </div>
      `;
    });
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  
  const assessment = {
    date: document.getElementById('interviewDate').value,
    interviewer: document.getElementById('interviewerName').value,
    role: document.getElementById('interviewerRole').value,
    candidate: document.getElementById('candidateName').value,
    level: document.getElementById('candidateLevel').value,
    scores: {}
  };

  // Hitung skor
  let total = 0;
  document.querySelectorAll('#scoreSection input').forEach(input => {
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
  
  try {
    // Kirim ke Google Sheets
    await submitToGoogleSheets({
      tanggal: assessment.date,
      interviewer: assessment.interviewer,
      role: assessment.role,
      kandidat: assessment.candidate,
      level: assessment.level,
      total: currentAssessment.total,
      status: currentAssessment.status
    });
    
    // Simpan ke riwayat
    saveToHistory();
    
  } catch (error) {
    console.error('Error:', error);
    alert('Gagal menyimpan data: ' + error.message);
  }
}

async function submitToGoogleSheets(data) {
  const response = await fetch(scriptURL, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  console.log('Google Sheets Response:', result);
  
  if(result.status === "success") {
    alert('Data berhasil disimpan ke Google Sheet!');
  } else {
    throw new Error(result.message);
  }
}

function showResult() {
  document.getElementById('resultContainer').classList.remove('hidden');
  document.getElementById('finalScore').textContent = currentAssessment.total;
  document.getElementById('resultStatus').textContent = currentAssessment.status;
  
  renderChart();
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
            callback: function(value) {
              return value % 1 === 0 ? value : null;
            }
          },
          angleLines: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          pointLabels: {
            font: {
              size: 12
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

// Fungsi untuk menyimpan riwayat (tambahkan implementasi)
function saveToHistory() {
  // Implementasi penyimpanan riwayat ke localStorage atau lainnya
}
function exportToPDF() {
  const { date, interviewer, role, candidate, level, scores, total, status } = currentAssessment;

  const doc = new jspdf.jsPDF();
  doc.setFontSize(14);
  doc.text(`Hasil Assessment Kandidat`, 20, 20);
  doc.setFontSize(12);
  doc.text(`Tanggal: ${date}`, 20, 30);
  doc.text(`Interviewer: ${interviewer} (${role})`, 20, 40);
  doc.text(`Kandidat: ${candidate} (${level})`, 20, 50);

  let y = 65;
  doc.text("Detail Skor:", 20, y);
  y += 10;
  for (const [category, score] of Object.entries(scores)) {
    doc.text(`${category}: ${score}`, 30, y);
    y += 8;
  }

  y += 5;
  doc.text(`Total Skor: ${total}`, 20, y);
  y += 10;
  doc.text(`Status: ${status}`, 20, y);

  doc.save(`Assessment_${candidate}.pdf`);
}

// Panggil saat klik tab riwayat
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));
  
  document.getElementById(tabId).classList.add('active');
  document.querySelector(`.tab-link[onclick="showTab('${tabId}')"]`).classList.add('active');

  if (tabId === 'history') {
    fetchHistory();
  }
}

// Ambil data dari Google Sheets (GET method)
async function fetchHistory() {
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = 'Memuat...';

  try {
    const response = await fetch(scriptURL);
    const data = await response.json();
    
    if (Array.isArray(data)) {
      historyList.innerHTML = '';
      data.reverse().forEach(row => {
        const item = document.createElement('div');
        item.classList.add('history-item');
        item.innerHTML = `
          <div>
            <strong>${row.kandidat}</strong> - ${row.level}<br>
            ${row.tanggal} oleh ${row.interviewer} (${row.role})<br>
            Skor: ${row.total} - ${row.status}
          </div>
        `;
        historyList.appendChild(item);
      });
    } else {
      historyList.innerHTML = 'Gagal memuat data.';
    }
  } catch (err) {
    console.error(err);
    historyList.innerHTML = 'Terjadi kesalahan.';
  }
}
