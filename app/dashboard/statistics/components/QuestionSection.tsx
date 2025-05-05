'use client';

import { Card, Title, Text } from "@tremor/react";
import { Bar, Pie, Line } from 'react-chartjs-2';

const colors = {
  primary: ['#1D4ED8', '#B91C1C', '#15803D', '#7C3AED', '#EA580C'],
  secondary: ['#0E7490', '#9D174D', '#3F6212', '#6D28D9', '#A16207'],
  accent: ['#EAB308', '#0EA5E9', '#DB2777', '#65A30D', '#4F46E5'],
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  color: '#94a3b8', // text color
  scales: {
    x: {
      grid: {
        color: '#334155',
      },
      ticks: {
        color: '#94a3b8',
      }
    },
    y: {
      grid: {
        color: '#334155',
      },
      ticks: {
        color: '#94a3b8',
      }
    }
  },
  plugins: {
    legend: {
      labels: {
        color: '#94a3b8',
        font: { size: 11 }
      }
    }
  }
};

export const QuestionSection = ({ question }: { question: any }) => (
  <Card className="p-4 mb-4 bg-slate-800">
    <Title className="mb-6 text-gray-100">{question.questionText}</Title>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Sex Distribution Chart */}
      <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
        <Text className="font-medium mb-2 text-gray-300">Distribution par Sexe</Text>
        <div className="h-[250px]">
          <Bar
            data={{
              labels: Object.keys(question.responseBySex.Homme),
              datasets: [
                {
                  label: 'Homme',
                  data: Object.values(question.responseBySex.Homme),
                  backgroundColor: colors.primary[0],
                },
                {
                  label: 'Femme',
                  data: Object.values(question.responseBySex.Femme),
                  backgroundColor: colors.primary[1],
                }
              ]
            }}
            options={{
              ...chartOptions,
              indexAxis: 'y',
              scales: {
                x: {
                  ...chartOptions.scales.x,
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    ...chartOptions.scales.x.ticks,
                    callback: (value) => `${value}%`
                  }
                }
              },
              plugins: {
                ...chartOptions.plugins,
                legend: { 
                  ...chartOptions.plugins.legend,
                  position: 'bottom'
                },
                datalabels: {
                  color: '#fff',
                  font: { weight: 'bold', size: 11 },
                  formatter: (value) => value > 0 ? `${value}%` : ''
                }
              }
            }}
          />
        </div>
      </div>

      {/* Marital State Charts */}
      {Object.entries(question.responseByMaritalState).map(([state, data]: [string, any], index) => (
        <div key={state} className="p-4 bg-slate-900 rounded-lg border border-slate-700">
          <Text className="font-medium mb-2 text-gray-300">État Civil: {state}</Text>
          <div className="h-[250px]">
            <Pie
              data={{
                labels: Object.keys(data),
                datasets: [{
                  data: Object.values(data),
                  backgroundColor: colors.secondary,
                  label: state
                }]
              }}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    ...chartOptions.plugins.legend,
                    position: 'bottom'
                  },
                  datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 11 },
                    formatter: (value) => value > 0 ? `${value}%` : ''
                  }
                }
              }}
            />
          </div>
        </div>
      ))}

      {/* Service Charts */}
      {Object.entries(question.responseByService).map(([service, data]: [string, any], index) => (
        <div key={service} className="p-4 bg-slate-900 rounded-lg border border-slate-700">
          <Text className="font-medium mb-2 text-gray-300">Service: {service}</Text>
          <div className="h-[250px]">
            <Line
              data={{
                labels: Object.keys(data),
                datasets: [{
                  data: Object.values(data),
                  borderColor: colors.accent[index],
                  backgroundColor: `${colors.accent[index]}20`,
                  label: service,
                  tension: 0.3,
                  fill: true
                }]
              }}
              options={{
                ...chartOptions,
                scales: {
                  ...chartOptions.scales,
                  y: {
                    ...chartOptions.scales.y,
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                      ...chartOptions.scales.y.ticks,
                      callback: (value) => `${value}%`
                    }
                  }
                },
                plugins: {
                  ...chartOptions.plugins,
                  legend: { display: false },
                  datalabels: {
                    color: colors.accent[index],
                    font: { weight: 'bold', size: 11 },
                    formatter: (value) => value > 0 ? `${value}%` : ''
                  }
                }
              }}
            />
          </div>
        </div>
      ))}
    </div>
  </Card>
); 