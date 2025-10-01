const API_URL = 'http://localhost:5000/api/data';
    
// Elementos do DOM
let myChart;
const loadingChart = document.getElementById('loading-chart');
const errorChart = document.getElementById('error-chart');
const chartCanvas = document.getElementById('myChart');
const refreshBtn = document.getElementById('refresh-btn');
const tableBody = document.querySelector('#data-table tbody');
const loadingTable = document.getElementById('loading-table');
const statsContainer = document.getElementById('stats-container');

// Filtros
const limitSelect = document.getElementById('limit-select');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const applyFiltersBtn = document.getElementById('apply-filters');
const resetFiltersBtn = document.getElementById('reset-filters');

// Estatísticas
const totalRecordsEl = document.getElementById('total-records');
const avgHumidityEl = document.getElementById('avg-humidity');
const avgTemperatureEl = document.getElementById('avg-temperature');
const periodRangeEl = document.getElementById('period-range');

// Paginação
const paginationEl = document.getElementById('pagination');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfoEl = document.getElementById('page-info');
const showingFromEl = document.getElementById('showing-from');
const showingToEl = document.getElementById('showing-to');
const totalItemsEl = document.getElementById('total-items');

// Exportação
const exportChartBtn = document.getElementById('export-chart');
const exportCsvBtn = document.getElementById('export-csv');

// Estado da aplicação
let currentData = [];
let currentPage = 1;
const itemsPerPage = 20;

// Configurar datas padrão (últimos 7 dias)
function setDefaultDates() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    
    endDateInput.value = end.toISOString().slice(0, 16);
    startDateInput.value = start.toISOString().slice(0, 16);
}

// Buscar dados da API
async function fetchData() {
    loadingChart.classList.remove('hidden');
    loadingTable.classList.remove('hidden');
    chartCanvas.classList.add('hidden');
    errorChart.classList.add('hidden');
    statsContainer.classList.add('hidden');
    
    try {
        const limit = limitSelect.value;
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        
        // Construir URL com parâmetros
        let url = `${API_URL}?limit=${limit}`;
        if (startDate) {
            url += `&start_date=${startDate}`;
        }
        if (endDate) {
            url += `&end_date=${endDate}`;
        }
        
        console.log('Buscando dados com URL:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Erro na resposta da rede: ' + response.statusText);
        }
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        const feeds = data.feeds || [];
        
        if (feeds.length === 0) {
            loadingChart.textContent = 'Nenhum dado encontrado para os filtros aplicados.';
            loadingTable.classList.add('hidden');
            statsContainer.classList.add('hidden');
            return { labels: [], humidityData: [], temperatureData: [], feeds: [] };
        }

        // Filtrar dados nulos (redundante, mas seguro)
        const filteredFeeds = feeds.filter(feed => 
            feed.field1 !== null && feed.field2 !== null
        );
        
        // Converter datas para labels
        const labels = filteredFeeds.map(feed => {
            const date = new Date(feed.created_at);
            return date.toLocaleString('pt-BR');
        });
        
        const humidityData = filteredFeeds.map(feed => parseFloat(feed.field1));
        const temperatureData = filteredFeeds.map(feed => parseFloat(feed.field2));

        currentData = filteredFeeds;
        updateTable();
        updateStats(filteredFeeds);
        
        loadingChart.classList.add('hidden');
        chartCanvas.classList.remove('hidden');
        loadingTable.classList.add('hidden');
        statsContainer.classList.remove('hidden');
        
        return { labels, humidityData, temperatureData, feeds: filteredFeeds };

    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        loadingChart.textContent = '';
        errorChart.textContent = `Erro ao carregar os dados: ${error.message}. Verifique se a API está rodando.`;
        errorChart.classList.remove('hidden');
        loadingTable.classList.add('hidden');
        statsContainer.classList.add('hidden');
        return { labels: [], humidityData: [], temperatureData: [], feeds: [] };
    }
}

// Filtrar dados por data
function filterDataByDate(feeds, startDate, endDate) {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    return feeds.filter(feed => {
        const feedDate = new Date(feed.created_at);
        
        if (start && feedDate < start) return false;
        if (end && feedDate > end) return false;
        
        return true;
    });
}

// Atualizar estatísticas
function updateStats(feeds) {
    if (feeds.length === 0) {
        totalRecordsEl.textContent = '0';
        avgHumidityEl.textContent = '0%';
        avgTemperatureEl.textContent = '0°C';
        periodRangeEl.textContent = '-';
        return;
    }
    
    const humidities = feeds.map(feed => parseFloat(feed.field1)).filter(val => !isNaN(val));
    const temperatures = feeds.map(feed => parseFloat(feed.field2)).filter(val => !isNaN(val));
    
    const avgHumidity = humidities.length > 0 ? (humidities.reduce((a, b) => a + b) / humidities.length).toFixed(2) : 0;
    const avgTemperature = temperatures.length > 0 ? (temperatures.reduce((a, b) => a + b) / temperatures.length).toFixed(2) : 0;
    
    const dates = feeds.map(feed => new Date(feed.created_at));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    totalRecordsEl.textContent = feeds.length;
    avgHumidityEl.textContent = `${avgHumidity}%`;
    avgTemperatureEl.textContent = `${avgTemperature}°C`;
    periodRangeEl.textContent = `${minDate.toLocaleDateString('pt-BR')} - ${maxDate.toLocaleDateString('pt-BR')}`;
}

// Atualizar tabela com paginação
function updateTable() {
    tableBody.innerHTML = '';
    
    if (currentData.length === 0) {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `<td colspan="3" class="px-6 py-4 whitespace-nowrap text-center text-sm italic text-gray-500">Nenhum dado encontrado.</td>`;
        tableBody.appendChild(noDataRow);
        paginationEl.classList.add('hidden');
        return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, currentData.length);
    const pageData = currentData.slice(startIndex, endIndex);
    
    pageData.forEach(feed => {
        const row = document.createElement('tr');
        const humidity = feed.field1 !== null ? `${parseFloat(feed.field1).toFixed(2)}%` : 'N/A';
        const temperature = feed.field2 !== null ? `${parseFloat(feed.field2).toFixed(2)}°C` : 'N/A';
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(feed.created_at).toLocaleString('pt-BR')}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${humidity}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${temperature}</td>
        `;
        tableBody.appendChild(row);
    });
    
    updatePagination();
}

// Atualizar controles de paginação
function updatePagination() {
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    
    showingFromEl.textContent = ((currentPage - 1) * itemsPerPage) + 1;
    showingToEl.textContent = Math.min(currentPage * itemsPerPage, currentData.length);
    totalItemsEl.textContent = currentData.length;
    pageInfoEl.textContent = `Página ${currentPage} de ${totalPages}`;
    
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    
    paginationEl.classList.remove('hidden');
}

// Renderizar gráfico
function renderChart(data) {
    const ctx = chartCanvas.getContext('2d');
    
    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Umidade (%)',
                    data: data.humidityData,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.4)',
                    borderWidth: 2,
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: 'Temperatura (°C)',
                    data: data.temperatureData,
                    borderColor: 'rgb(249, 115, 22)',
                    backgroundColor: 'rgba(249, 115, 22, 0.4)',
                    borderWidth: 2,
                    tension: 0.3,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Tempo'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Umidade (%)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Temperatura (°C)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(2);
                                if (context.dataset.label.includes('Umidade')) {
                                    label += '%';
                                } else {
                                    label += '°C';
                                }
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Exportar gráfico como PNG
function exportChart() {
    if (myChart) {
        const link = document.createElement('a');
        link.download = `grafico-sensor-${new Date().toISOString().split('T')[0]}.png`;
        link.href = chartCanvas.toDataURL();
        link.click();
    }
}

// Exportar dados como CSV
function exportToCSV() {
    if (currentData.length === 0) return;
    
    const headers = ['Data/Hora', 'Umidade (%)', 'Temperatura (°C)'];
    const csvData = currentData.map(feed => [
        new Date(feed.created_at).toLocaleString('pt-BR'),
        feed.field1 !== null ? parseFloat(feed.field1).toFixed(2) : 'N/A',
        feed.field2 !== null ? parseFloat(feed.field2).toFixed(2) : 'N/A'
    ]);
    
    const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `dados-sensor-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Event Listeners
refreshBtn.addEventListener('click', async () => {
    currentPage = 1;
    const data = await fetchData();
    renderChart(data);
});

applyFiltersBtn.addEventListener('click', async () => {
    currentPage = 1;
    const data = await fetchData();
    renderChart(data);
});

resetFiltersBtn.addEventListener('click', () => {
    limitSelect.value = '100';
    setDefaultDates();
    currentPage = 1;
    fetchData().then(renderChart);
});

prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        updateTable();
    }
});

nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        updateTable();
    }
});

exportChartBtn.addEventListener('click', exportChart);
exportCsvBtn.addEventListener('click', exportToCSV);

// Inicialização
async function init() {
    setDefaultDates();
    const data = await fetchData();
    renderChart(data);
}

window.onload = init;