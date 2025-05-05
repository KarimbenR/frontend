'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { fetchStatistics } from '@/app/actions/statistics';
import { fetchTableStats } from '@/app/actions/statsTable';
import { fetchGlobalStats } from '@/app/actions/globalStats';
import { fetchCustomStats } from '@/app/actions/customStats';
import {
  Card,
  Title,
  Text,
  TabList,
  Tab,
  TabGroup,
  TabPanels,
  TabPanel,
} from "@tremor/react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title as ChartTitle, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { Pie, Bar, Radar } from 'react-chartjs-2';
import { useRouter } from 'next/navigation';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { QuestionSection } from './components/QuestionSection';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartDataLabels
);

export default function Statistics() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [tableData, setTableData] = useState<any>(null);
  const [globalData, setGlobalData] = useState<any>(null);
  const [customData, setCustomData] = useState<any>(null);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [isCustomLoading, setIsCustomLoading] = useState(false);
  const [isRadarLoading, setIsRadarLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchStatistics(session?.user?.accessToken as string);
        setStats(data);
      } catch (error) {
        toast.error('Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.accessToken) {
      loadStats();
    }
  }, []);

  // Fetch table data when the "Tableau" tab is selected
  useEffect(() => {
    const fetchTableData = async () => {
      if (activeTab === 2 && !tableData && session?.user?.accessToken) {
        setIsTableLoading(true);
        try {
          // Use server action which handles CORS issues
          const data = await fetchTableStats(session.user.accessToken);
          setTableData(data);
        } catch (error) {
          toast.error('Échec du chargement des données du tableau');
          console.error(error);
        } finally {
          setIsTableLoading(false);
        }
      }
    };
    
    fetchTableData();
  }, [activeTab, tableData, session]);

  // Fetch global data when the "Global" tab is selected
  useEffect(() => {
    const fetchGlobalData = async () => {
      if (activeTab === 3 && !globalData && session?.user?.accessToken) {
        setIsGlobalLoading(true);
        try {
          // Use server action which handles CORS issues
          const data = await fetchGlobalStats(session.user.accessToken);
          setGlobalData(data);
        } catch (error) {
          toast.error('Échec du chargement des données globales');
          console.error(error);
        } finally {
          setIsGlobalLoading(false);
        }
      }
    };
    
    fetchGlobalData();
  }, [activeTab, globalData, session]);

  // Fetch custom data when the "Custom" tab is selected
  useEffect(() => {
    const fetchCustomData = async () => {
      if (activeTab === 4 && !customData && session?.user?.accessToken) {
        setIsCustomLoading(true);
        try {
          // Use server action which handles CORS issues
          const data = await fetchCustomStats(session.user.accessToken);
          setCustomData(data);
          
          // Also fetch global data if it's not already loaded
          if (!globalData) {
            const globalResult = await fetchGlobalStats(session.user.accessToken);
            setGlobalData(globalResult);
          }
        } catch (error) {
          toast.error('Échec du chargement des données personnalisées');
          console.error(error);
        } finally {
          setIsCustomLoading(false);
        }
      }
    };
    
    fetchCustomData();
  }, [activeTab, customData, globalData, session]);

  // Fetch both global and custom data when the "Radar" tab is selected
  useEffect(() => {
    const fetchRadarData = async () => {
      if (activeTab === 5 && session?.user?.accessToken) {
        const needGlobalData = !globalData;
        const needCustomData = !customData;
        
        if (!needGlobalData && !needCustomData) return;
        
        setIsRadarLoading(true);
        
        try {
          const promises = [];
          
          if (needGlobalData) {
            promises.push(
              fetchGlobalStats(session.user.accessToken)
                .then(data => setGlobalData(data))
            );
          }
          
          if (needCustomData) {
            promises.push(
              fetchCustomStats(session.user.accessToken)
                .then(data => setCustomData(data))
            );
          }
          
          await Promise.all(promises);
        } catch (error) {
          toast.error('Échec du chargement des données radar');
          console.error(error);
        } finally {
          setIsRadarLoading(false);
        }
      }
    };
    
    fetchRadarData();
  }, [activeTab, globalData, customData, session]);

  const colors = {
    primary: ['#1D4ED8', '#B91C1C', '#15803D', '#7C3AED', '#EA580C'],  // deep blue, deep red, emerald green, royal purple, vivid orange
    secondary: ['#0E7490', '#9D174D', '#3F6212', '#6D28D9', '#A16207'], // deep cyan, dark pink, olive green, dark violet, mustard
    accent: ['#EAB308', '#0EA5E9', '#DB2777', '#65A30D', '#4F46E5'],    // gold, sky blue, magenta, bright green, deep indigo
    
  };

  const DemographicsSection = () => (
    <div className="space-y-8">
      {/* First Row - 3 Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sex Distribution */}
        <Card className="p-4">
          <Title className="text-center text-sm mb-4">Distribution par Sexe</Title>
          <div className="h-48"> {/* Fixed height container */}
            <Pie
              data={{
                labels: Object.keys(stats.demographics.bySex),
                datasets: [{
                  data: Object.values(stats.demographics.bySex),
                  backgroundColor: colors.primary,
                }]
              }}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 12,
                      font: {
                        size: 11
                      }
                    }
                  },
                  datalabels: {
                    color: '#fff',
                    font: { weight: 'bold' },
                    formatter: (value) => value > 0 ? `${value}%` : '',
                    anchor: 'center',
                    align: 'center',
                  }
                }
              }}
            />
          </div>
        </Card>

        {/* Marital Status Distribution */}
        <Card className="p-4">
          <Title className="text-center text-sm mb-4">État Civil</Title>
          <div className="h-48">
            <Pie
              data={{
                labels: Object.keys(stats.demographics.byMaritalState),
                datasets: [{
                  data: Object.values(stats.demographics.byMaritalState),
                  backgroundColor: colors.secondary,
                }]
              }}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 12,
                      font: {
                        size: 11
                      }
                    }
                  },
                  datalabels: {
                    color: '#fff',
                    font: { weight: 'bold' },
                    formatter: (value) => value > 0 ? `${value}%` : '',
                    anchor: 'center',
                    align: 'center',
                  }
                }
              }}
            />
          </div>
        </Card>

        {/* Service Distribution */}
        <Card className="p-4">
          <Title className="text-center text-sm mb-4">Distribution par Service</Title>
          <div className="h-48">
            <Pie
              data={{
                labels: Object.keys(stats.demographics.byService),
                datasets: [{
                  data: Object.values(stats.demographics.byService),
                  backgroundColor: colors.accent,
                }]
              }}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 12,
                      font: {
                        size: 11
                      }
                    }
                  },
                  datalabels: {
                    color: '#fff',
                    font: { weight: 'bold' },
                    formatter: (value) => value > 0 ? `${value}%` : '',
                    anchor: 'center',
                    align: 'center',
                  }
                }
              }}
            />
          </div>
        </Card>
      </div>

      {/* Second Row - Cross Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sex by Marital State - Stacked Bar Chart */}
        <Card className="p-4">
          <Title className="text-center text-sm mb-4">Sexe par État Civil</Title>
          <div className="h-48">
            <Bar
              data={{
                labels: Object.keys(stats.demographics.sexByMaritalState.Homme),
                datasets: [{
                  label: 'Homme',
                  data: Object.values(stats.demographics.sexByMaritalState.Homme),
                  backgroundColor: colors.primary[0],
                }, {
                  label: 'Femme',
                  data: Object.values(stats.demographics.sexByMaritalState.Femme),
                  backgroundColor: colors.primary[1],
                }]
              }}
              options={{
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                  x: {
                    stacked: true,
                    ticks: {
                      callback: (value) => `${value}%`
                    }
                  },
                  y: {
                    stacked: true
                  }
                },
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { font: { size: 11 } }
                  },
                  datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 11 },
                    formatter: (value) => value > 0 ? `${value}%` : '',
                  }
                }
              }}
            />
          </div>
        </Card>

        {/* Sex by Service - Grouped Bar Chart */}
        <Card className="p-4">
          <Title className="text-center text-sm mb-4">Sexe par Service</Title>
          <div className="h-48">
            <Bar
              data={{
                labels: Object.keys(stats.demographics.sexByService.Homme),
                datasets: [{
                  label: 'Homme',
                  data: Object.values(stats.demographics.sexByService.Homme),
                  backgroundColor: colors.secondary[0],
                }, {
                  label: 'Femme',
                  data: Object.values(stats.demographics.sexByService.Femme),
                  backgroundColor: colors.secondary[1],
                }]
              }}
              options={{
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                  x: {
                    ticks: {
                      callback: (value) => `${value}%`
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { font: { size: 11 } }
                  },
                  datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 11 },
                    formatter: (value) => value > 0 ? `${value}%` : '',
                  }
                }
              }}
            />
          </div>
        </Card>

        {/* Marital State by Service - Stacked Bar Chart */}
        <Card className="p-4">
          <Title className="text-center text-sm mb-4">État Civil par Service</Title>
          <div className="h-48">
            <Bar
              data={{
                labels: Object.keys(stats.demographics.maritalStateByService.Marié),
                datasets: Object.entries(stats.demographics.maritalStateByService).map(([state, data]: [string, any], index) => ({
                  label: state,
                  data: Object.values(data),
                  backgroundColor: colors.accent[index % colors.accent.length],
                }))
              }}
              options={{
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                  x: {
                    stacked: true,
                    ticks: {
                      callback: (value) => `${value}%`
                    }
                  },
                  y: {
                    stacked: true
                  }
                },
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { font: { size: 11 } }
                  },
                  datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 11 },
                    formatter: (value) => value > 0 ? `${value}%` : '',
                  }
                }
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  );

  const TableauSection = () => {
    if (isTableLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      );
    }
    
    if (!tableData) {
      return (
        <div className="text-center text-gray-500 h-64 flex items-center justify-center">
          Aucune donnée disponible
        </div>
      );
    }
    
    return (
      <div className="space-y-8">
        <Card className="p-6">
          <Title className="mb-4 text-center">Données Démographiques</Title>
          
          {/* Genre */}
          <div className="mb-8">
            <Text className="font-bold text-lg mb-2">Genre</Text>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="font-bold">Donnée</TableHead>
                  <TableHead className="font-bold">Effectif</TableHead>
                  <TableHead className="font-bold">Pourcentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.genders.map((item: any) => (
                  <TableRow key={item.type}>
                    <TableCell className="font-medium">{item.type}</TableCell>
                    <TableCell>{item.effectif}</TableCell>
                    <TableCell>{item.percentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Âge */}
          <div className="mb-8">
            <Text className="font-bold text-lg mb-2">Âge</Text>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="font-bold">Donnée</TableHead>
                  <TableHead className="font-bold">Effectif</TableHead>
                  <TableHead className="font-bold">Pourcentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.ages.map((item: any) => (
                  <TableRow key={item.type}>
                    <TableCell className="font-medium">{item.type}</TableCell>
                    <TableCell>{item.effectif}</TableCell>
                    <TableCell>{item.percentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* État Civil */}
          <div className="mb-8">
            <Text className="font-bold text-lg mb-2">État Civil</Text>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="font-bold">Donnée</TableHead>
                  <TableHead className="font-bold">Effectif</TableHead>
                  <TableHead className="font-bold">Pourcentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.state.map((item: any) => (
                  <TableRow key={item.type}>
                    <TableCell className="font-medium">{item.type}</TableCell>
                    <TableCell>{item.effectif}</TableCell>
                    <TableCell>{item.percentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Années d'expérience */}
          <div className="mb-8">
            <Text className="font-bold text-lg mb-2">Années d&apos;expérience</Text>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="font-bold">Donnée</TableHead>
                  <TableHead className="font-bold">Effectif</TableHead>
                  <TableHead className="font-bold">Pourcentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.exp_years.map((item: any) => (
                  <TableRow key={item.type}>
                    <TableCell className="font-medium">{item.type}</TableCell>
                    <TableCell>{item.effectif}</TableCell>
                    <TableCell>{item.percentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Années d'expérience dans le service actuel */}
          <div className="mb-8">
            <Text className="font-bold text-lg mb-2">Années d&apos;expérience dans le service actuel</Text>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="font-bold">Donnée</TableHead>
                  <TableHead className="font-bold">Effectif</TableHead>
                  <TableHead className="font-bold">Pourcentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.exp_years_c.map((item: any) => (
                  <TableRow key={item.type}>
                    <TableCell className="font-medium">{item.type}</TableCell>
                    <TableCell>{item.effectif}</TableCell>
                    <TableCell>{item.percentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Service */}
          <div className="mb-8">
            <Text className="font-bold text-lg mb-2">Service</Text>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="font-bold">Donnée</TableHead>
                  <TableHead className="font-bold">Effectif</TableHead>
                  <TableHead className="font-bold">Pourcentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.service.map((item: any) => (
                  <TableRow key={item.type}>
                    <TableCell className="font-medium">{item.type}</TableCell>
                    <TableCell>{item.effectif}</TableCell>
                    <TableCell>{item.percentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Nombre d'enfants */}
          <div>
            <Text className="font-bold text-lg mb-2">Nombre d&apos;enfants</Text>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="font-bold">Donnée</TableHead>
                  <TableHead className="font-bold">Effectif</TableHead>
                  <TableHead className="font-bold">Pourcentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.nb_childs.map((item: any) => (
                  <TableRow key={item.type}>
                    <TableCell className="font-medium">{item.type}</TableCell>
                    <TableCell>{item.effectif}</TableCell>
                    <TableCell>{item.percentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    );
  };

  const GlobalSection = () => {
    if (isGlobalLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      );
    }
    
    if (!globalData) {
      return (
        <div className="text-center text-gray-500 h-64 flex items-center justify-center">
          Aucune donnée disponible
        </div>
      );
    }

    // Map score labels to meaningful text
    const scoreLabels = {
      "score 31-35": "Moyen",
      "score > 41": "Trés Élevé",
      "score 27-30": "Faible",
      "score 0-26": "Trés Faible",
      "score 36-40": "Élevé",
    };

    // Function to format score label
    const formatScoreLabel = (scoreKey: string) => {
      return scoreLabels[scoreKey as keyof typeof scoreLabels] || scoreKey;
    };

    // Sort score categories in a consistent order
    const sortScores = (scores: any[]) => {
      const order = {
        "score 0-26": 1,
        "score 27-30": 2,
        "score 31-35": 3,
        "score 36-40": 4,
        "score > 41": 5
      };
      
      return [...scores].sort((a, b) => order[a.score as keyof typeof order] - order[b.score as keyof typeof order]);
    };
    
    // Global vertical bar chart data
    const globalChartData = {
      labels: sortScores(globalData.global).map((item: any) => formatScoreLabel(item.score)),
      datasets: [{
        label: 'Score Global',
        data: sortScores(globalData.global).map((item: any) => item.value),
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1
      }]
    };

    // Function to prepare data for horizontal bar charts for each category
    const prepareHorizontalChartData = (categoryData: any[], title: string) => {
      // For horizontal charts, we want score categories as y-axis (labels)
      const uniqueScores = Array.from(
        new Set(
          categoryData.flatMap((category: any) => 
            category.score.map((s: any) => s.score)
          )
        )
      ).sort((a, b) => {
        const order = {
          "score 0-26": 1,
          "score 27-30": 2,
          "score 31-35": 3,
          "score 36-40": 4,
          "score > 41": 5
        };
        return order[a as keyof typeof order] - order[b as keyof typeof order];
      });

      // Map the raw score labels to formatted labels
      const formattedLabels = uniqueScores.map((score) => formatScoreLabel(score));

      // Create datasets for each type (Marié, Célibataire, etc.)
      const datasets = categoryData.map((category: any, index: number) => {
        // Map each score to its corresponding value
        const scoreMap = new Map(
          category.score.map((s: any) => [s.score, s.value])
        );
        
        // Color patterns
        const colors = [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ];
        
        const borderColors = [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
        ];

        return {
          label: category.type,
          data: uniqueScores.map((score) => scoreMap.get(score) || 0),
          backgroundColor: colors[index % colors.length],
          borderColor: borderColors[index % borderColors.length],
          borderWidth: 1
        };
      });

      return {
        title,
        labels: formattedLabels,
        datasets
      };
    };

    // Prepare data for each category
    const gendersChartData = prepareHorizontalChartData(globalData.genders, 'Scores par Genre');
    const agesChartData = prepareHorizontalChartData(globalData.ages, 'Scores par Âge');
    const stateChartData = prepareHorizontalChartData(globalData.state, 'Scores par État Civil');
    const serviceChartData = prepareHorizontalChartData(globalData.service, 'Scores par Service');

    return (
      <div className="space-y-8">
        {/* Score Legend */}
        <Card className="p-6">
          <Title className="mb-4 text-center">Légende des Scores</Title>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
            <div className="bg-red-100 p-3 rounded-md shadow">
              <div className="font-bold">Trés Faible</div>
              <div className="text-sm text-gray-600">score 0-26</div>
            </div>
            <div className="bg-orange-100 p-3 rounded-md shadow">
              <div className="font-bold">Faible</div>
              <div className="text-sm text-gray-600">score 27-30</div>
            </div>
            <div className="bg-yellow-100 p-3 rounded-md shadow">
              <div className="font-bold">Moyen</div>
              <div className="text-sm text-gray-600">score 31-35</div>
            </div>
            <div className="bg-blue-100 p-3 rounded-md shadow">
              <div className="font-bold">Élevé</div>
              <div className="text-sm text-gray-600">score 36-40</div>
            </div>
            <div className="bg-green-100 p-3 rounded-md shadow">
              <div className="font-bold">Trés Élevé</div>
              <div className="text-sm text-gray-600">score {`>`} 41</div>
            </div>
          </div>
        </Card>

        {/* Global Score Chart */}
        <Card className="p-6">
          <Title className="mb-4 text-center">Score Global</Title>
          <div className="h-80">
            <Bar
              data={globalChartData}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Pourcentage'
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: false
                  },
                  datalabels: {
                    anchor: 'end',
                    align: 'top',
                    formatter: (value) => `${value}%`,
                    font: {
                      weight: 'bold'
                    }
                  }
                }
              }}
            />
          </div>
        </Card>

        {/* Gender Scores Chart */}
        <Card className="p-6">
          <Title className="mb-4 text-center">{gendersChartData.title}</Title>
          <div className="h-80">
            <Bar
              data={{
                labels: gendersChartData.labels,
                datasets: gendersChartData.datasets
              }}
              options={{
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                  x: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Pourcentage'
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'bottom'
                  },
                  datalabels: {
                    formatter: (value) => value > 0 ? `${value}%` : '',
                    font: {
                      weight: 'bold'
                    },
                    color: 'white'
                  }
                }
              }}
            />
          </div>
        </Card>

        {/* Age Scores Chart */}
        <Card className="p-6">
          <Title className="mb-4 text-center">{agesChartData.title}</Title>
          <div className="h-[500px]">
            <Bar
              data={{
                labels: agesChartData.labels,
                datasets: agesChartData.datasets
              }}
              options={{
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                  x: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Pourcentage'
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'bottom'
                  },
                  datalabels: {
                    formatter: (value) => value > 0 ? `${value}%` : '',
                    font: {
                      weight: 'bold'
                    },
                    color: 'white'
                  }
                }
              }}
            />
          </div>
        </Card>

        {/* Marital State Scores Chart */}
        <Card className="p-6">
          <Title className="mb-4 text-center">{stateChartData.title}</Title>
          <div className="h-80">
            <Bar
              data={{
                labels: stateChartData.labels,
                datasets: stateChartData.datasets
              }}
              options={{
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                  x: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Pourcentage'
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'bottom'
                  },
                  datalabels: {
                    formatter: (value) => value > 0 ? `${value}%` : '',
                    font: {
                      weight: 'bold'
                    },
                    color: 'white'
                  }
                }
              }}
            />
          </div>
        </Card>

        {/* Service Scores Chart */}
        <Card className="p-6">
          <Title className="mb-4 text-center">{serviceChartData.title}</Title>
          <div className="h-80">
            <Bar
              data={{
                labels: serviceChartData.labels,
                datasets: serviceChartData.datasets
              }}
              options={{
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                  x: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Pourcentage'
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'bottom'
                  },
                  datalabels: {
                    formatter: (value) => value > 0 ? `${value}%` : '',
                    font: {
                      weight: 'bold'
                    },
                    color: 'white'
                  }
                }
              }}
            />
          </div>
        </Card>
      </div>
    );
  };

  const CustomSection = () => {
    if (isCustomLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      );
    }
    
    if (!customData) {
      return (
        <div className="text-center text-gray-500 h-64 flex items-center justify-center">
          Aucune donnée disponible
        </div>
      );
    }

    // Map score labels to meaningful text (same as in GlobalSection)
    const scoreLabels = {
      "score 31-35": "Moyen",
      "score > 41": "Trés Élevé",
      "score 27-30": "Faible",
      "score 0-26": "Trés Faible",
      "score 36-40": "Élevé",
    };

    // Map group IDs to meaningful titles
    const groupTitles = {
      "group1": "Perturbation psychosomatique",
      "group2": "Perturbation cognitive",
      "group3": "Perturbation émotionnelle",
      "group4": "Souvenirs traumatisants"
    };

    // Function to format score label
    const formatScoreLabel = (scoreKey: string) => {
      return scoreLabels[scoreKey as keyof typeof scoreLabels] || scoreKey;
    };

    // Sort score categories in a consistent order
    const sortScores = (scores: any[]) => {
      const order = {
        "score 0-26": 1,
        "score 27-30": 2,
        "score 31-35": 3,
        "score 36-40": 4,
        "score > 41": 5
      };
      
      return [...scores].sort((a, b) => order[a.score as keyof typeof order] - order[b.score as keyof typeof order]);
    };

    // Function to prepare chart data for each group
    const prepareColumnChartData = (groupId: string) => {
      const groupData = customData[groupId];
      
      if (!groupData) return {
        labels: [],
        datasets: []
      };

      // Sort the scores in order
      const sortedScores = sortScores(groupData);
      
      return {
        labels: sortedScores.map(item => formatScoreLabel(item.score)),
        datasets: [
          {
            label: groupTitles[groupId as keyof typeof groupTitles] || groupId,
            data: sortedScores.map(item => item.value),
            backgroundColor: groupId === 'group1' ? 'rgba(54, 162, 235, 0.8)' 
                           : groupId === 'group2' ? 'rgba(255, 99, 132, 0.8)'
                           : groupId === 'group3' ? 'rgba(75, 192, 192, 0.8)'
                           : 'rgba(255, 206, 86, 0.8)',
            borderColor: groupId === 'group1' ? 'rgba(54, 162, 235, 1)' 
                        : groupId === 'group2' ? 'rgba(255, 99, 132, 1)'
                        : groupId === 'group3' ? 'rgba(75, 192, 192, 1)'
                        : 'rgba(255, 206, 86, 1)',
            borderWidth: 1
          }
        ]
      };
    };

    // Common options for bar charts
    const columnChartOptions = {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Pourcentage'
          },
          ticks: {
            callback: (value: number) => `${value}%`
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        datalabels: {
          anchor: 'end',
          align: 'top',
          formatter: (value: number) => `${value}%`,
          font: {
            weight: 'bold'
          }
        }
      },
      maintainAspectRatio: false,
      responsive: true
    } as any;

    return (
      <div className="space-y-8">
        {/* Score Legend */}
        <Card className="p-6 border-l-4 border-blue-500">
          <Title className="mb-4 text-center">Légende des Scores</Title>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
            <div className="bg-gradient-to-br from-red-100 to-red-50 p-3 rounded-md shadow-md">
              <div className="font-bold">Trés Faible</div>
              <div className="text-sm text-gray-600">score 0-26</div>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-orange-50 p-3 rounded-md shadow-md">
              <div className="font-bold">Faible</div>
              <div className="text-sm text-gray-600">score 27-30</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 p-3 rounded-md shadow-md">
              <div className="font-bold">Moyen</div>
              <div className="text-sm text-gray-600">score 31-35</div>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-3 rounded-md shadow-md">
              <div className="font-bold">Élevé</div>
              <div className="text-sm text-gray-600">score 36-40</div>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-green-50 p-3 rounded-md shadow-md">
              <div className="font-bold">Trés Élevé</div>
              <div className="text-sm text-gray-600">score {`>`} 41</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6 border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-white">
          <Title className="mb-4 text-center">Scores par Catégorie de Perturbation</Title>
          <Text className="text-center text-gray-600 mb-6">
            Les graphiques ci-dessous montrent la distribution des scores pour chaque catégorie de perturbation.
            Les scores sont exprimés en pourcentage de la population étudiée.
          </Text>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Group 1 Chart - Perturbation psychosomatique */}
          <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow bg-white border border-gray-100 rounded-lg overflow-hidden">
            <Title className="mb-4 text-center border-b pb-3 text-black font-bold">Perturbation psychosomatique</Title>
            <div className="h-80">
              <Bar 
                data={prepareColumnChartData('group1')} 
                options={columnChartOptions} 
              />
            </div>
          </Card>

          {/* Group 2 Chart - Perturbation cognitive */}
          <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow bg-white border border-gray-100 rounded-lg overflow-hidden">
            <Title className="mb-4 text-center border-b pb-3 text-black font-bold">Perturbation cognitive</Title>
            <div className="h-80">
              <Bar 
                data={prepareColumnChartData('group2')} 
                options={columnChartOptions} 
              />
            </div>
          </Card>

          {/* Group 3 Chart - Perturbation émotionnelle */}
          <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow bg-white border border-gray-100 rounded-lg overflow-hidden">
            <Title className="mb-4 text-center border-b pb-3 text-black font-bold">Perturbation émotionnelle</Title>
            <div className="h-80">
              <Bar 
                data={prepareColumnChartData('group3')} 
                options={columnChartOptions} 
              />
            </div>
          </Card>

          {/* Group 4 Chart - Souvenirs traumatisants */}
          <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow bg-white border border-gray-100 rounded-lg overflow-hidden">
            <Title className="mb-4 text-center border-b pb-3 text-black font-bold">Souvenirs traumatisants</Title>
            <div className="h-80">
              <Bar 
                data={prepareColumnChartData('group4')} 
                options={columnChartOptions} 
              />
            </div>
          </Card>
        </div>

        <Card className="p-6 mt-8 border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-white">
          <Title className="mb-2 text-center">Guide d&apos;Interprétation</Title>
          <div className="prose mx-auto max-w-3xl">
            <ul className="list-disc pl-6 space-y-2">
              <li><span className="font-semibold">Perturbation psychosomatique</span>: Manifestations physiques résultant du stress psychologique.</li>
              <li><span className="font-semibold">Perturbation cognitive</span>: Difficultés liées à la concentration, la mémoire et la prise de décision.</li>
              <li><span className="font-semibold">Perturbation émotionnelle</span>: Changements dans la régulation des émotions et l&apos;humeur.</li>
              <li><span className="font-semibold">Souvenirs traumatisants</span>: Reviviscences et pensées intrusives liées aux événements traumatiques.</li>
            </ul>
            <p className="mt-4 text-sm text-gray-600">
              Une prévalence élevée dans une catégorie particulière peut indiquer un domaine nécessitant une attention particulière.
            </p>
          </div>
        </Card>
      </div>
    );
  };

  const RadarSection = () => {
    if (isRadarLoading || isGlobalLoading || isCustomLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      );
    }
    
    if (!globalData || !customData) {
      return (
        <div className="text-center text-gray-500 h-64 flex items-center justify-center">
          Aucune donnée disponible
        </div>
      );
    }

    // Map score labels to meaningful text (same as in other sections)
    const scoreLabels = {
      "score 31-35": "Moyen",
      "score > 41": "Trés Élevé",
      "score 27-30": "Faible",
      "score 0-26": "Trés Faible",
      "score 36-40": "Élevé",
    };

    // Map group IDs to meaningful titles
    const groupTitles = {
      "group1": "Perturbation psychosomatique",
      "group2": "Perturbation cognitive",
      "group3": "Perturbation émotionnelle",
      "group4": "Souvenirs traumatisants"
    };

    // Function to format score label
    const formatScoreLabel = (scoreKey: string) => {
      return scoreLabels[scoreKey as keyof typeof scoreLabels] || scoreKey;
    };

    // Sort score categories in a consistent order
    const sortScores = (scores: any[]) => {
      const order = {
        "score 0-26": 1,
        "score 27-30": 2,
        "score 31-35": 3,
        "score 36-40": 4,
        "score > 41": 5
      };
      
      return [...scores].sort((a, b) => order[a.score as keyof typeof order] - order[b.score as keyof typeof order]);
    };

    // Prepare global data in a map for easier access
    const globalScoresMap = new Map(
      globalData.global.map((item: any) => [item.score, item.value])
    );

    // Prepare data for each group's radar chart
    const prepareRadarData = (groupId: string) => {
      const groupData = customData[groupId];
      
      if (!groupData) return {
        labels: [],
        datasets: []
      };

      // Use all score categories in a consistent order
      const sortedScoreCategories = [
        "score 0-26",
        "score 27-30", 
        "score 31-35",
        "score 36-40",
        "score > 41"
      ];
      
      // Map group scores for easier access
      const groupScoresMap = new Map(
        groupData.map((item: any) => [item.score, item.value])
      );

      // Create formatted labels
      const formattedLabels = sortedScoreCategories.map(score => formatScoreLabel(score));
      
      return {
        labels: formattedLabels,
        datasets: [
          {
            label: 'Global',
            data: sortedScoreCategories.map(score => globalScoresMap.get(score) || 0),
            backgroundColor: 'rgba(54, 162, 235, 0.3)',
            borderColor: 'rgba(54, 162, 235, 1)',
            pointBackgroundColor: 'rgba(54, 162, 235, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1.5,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7
          },
          {
            label: groupTitles[groupId as keyof typeof groupTitles] || groupId,
            data: sortedScoreCategories.map(score => groupScoresMap.get(score) || 0),
            backgroundColor: 'rgba(255, 99, 132, 0.3)',
            borderColor: 'rgba(255, 99, 132, 1)',
            pointBackgroundColor: 'rgba(255, 99, 132, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1.5,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7
          }
        ]
      };
    };

    // Prepare radar chart data for all groups
    const group1RadarData = prepareRadarData('group1');
    const group2RadarData = prepareRadarData('group2');
    const group3RadarData = prepareRadarData('group3');
    const group4RadarData = prepareRadarData('group4');

    // Common options for radar charts with proper typing
    const radarOptions = {
      // Cast as 'any' to avoid TypeScript errors
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            boxWidth: 15,
            padding: 15,
            usePointStyle: true,
            pointStyleWidth: 10,
            font: {
              size: 12,
              family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          padding: 10,
          cornerRadius: 6,
          displayColors: true,
          usePointStyle: true,
          callbacks: {
            label: (context: any) => {
              return `${context.dataset.label}: ${context.raw}%`;
            }
          }
        },
        datalabels: {
          display: false
        }
      },
      scales: {
        r: {
          min: 0,
          max: 60,
          beginAtZero: true,
          backgroundColor: 'rgba(245, 245, 245, 0.5)',
          angleLines: {
            display: true,
            color: 'rgba(120, 120, 120, 0.2)',
            lineWidth: 1
          },
          grid: {
            color: 'rgba(120, 120, 120, 0.2)',
            circular: true
          },
          pointLabels: {
            font: {
              size: 14,
              weight: 'bold',
              family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
            },
            color: '#333',
            padding: 20
          },
          ticks: {
            backdropColor: 'transparent',
            z: 1,
            stepSize: 10,
            font: {
              size: 10
            },
            backdropPadding: 3,
            color: '#666',
            callback: (value: number) => value + '%'
          }
        }
      },
      elements: {
        line: {
          tension: 0.35,
          borderJoinStyle: 'round'
        },
        point: {
          radius: 5,
          hoverRadius: 7,
          borderWidth: 2,
          hitRadius: 10
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: 15
      },
      animation: {
        duration: 1500,
        easing: 'easeOutQuart'
      }
    } as any;

    return (
      <div className="space-y-8">
        {/* Score Legend */}
        <Card className="p-6 border-l-4 border-blue-500">
          <Title className="mb-4 text-center">Légende des Scores</Title>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
            <div className="bg-gradient-to-br from-red-100 to-red-50 p-3 rounded-md shadow-md">
              <div className="font-bold">Trés Faible</div>
              <div className="text-sm text-gray-600">score 0-26</div>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-orange-50 p-3 rounded-md shadow-md">
              <div className="font-bold">Faible</div>
              <div className="text-sm text-gray-600">score 27-30</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 p-3 rounded-md shadow-md">
              <div className="font-bold">Moyen</div>
              <div className="text-sm text-gray-600">score 31-35</div>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-3 rounded-md shadow-md">
              <div className="font-bold">Élevé</div>
              <div className="text-sm text-gray-600">score 36-40</div>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-green-50 p-3 rounded-md shadow-md">
              <div className="font-bold">Trés Élevé</div>
              <div className="text-sm text-gray-600">score {`>`} 41</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6 border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-white">
          <Title className="mb-4 text-center">Comparaison des Scores par Catégorie</Title>
          <Text className="text-center text-gray-600 mb-6">
            Les graphiques radar ci-dessous montrent la comparaison entre les scores globaux et 
            les scores par catégorie de perturbation. Plus la valeur est élevée sur chaque axe, plus la prévalence est importante.
          </Text>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Group 1 Radar - Perturbation psychosomatique */}
          <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow bg-white border border-gray-100 rounded-lg overflow-hidden">
            <Title className="mb-4 text-center border-b pb-3 text-black font-bold">Perturbation psychosomatique vs Global</Title>
            <div className="h-[450px]">
              <Radar data={group1RadarData} options={radarOptions} />
            </div>
          </Card>

          {/* Group 2 Radar - Perturbation cognitive */}
          <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow bg-white border border-gray-100 rounded-lg overflow-hidden">
            <Title className="mb-4 text-center border-b pb-3 text-black font-bold">Perturbation cognitive vs Global</Title>
            <div className="h-[450px]">
              <Radar data={group2RadarData} options={radarOptions} />
            </div>
          </Card>

          {/* Group 3 Radar - Perturbation émotionnelle */}
          <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow bg-white border border-gray-100 rounded-lg overflow-hidden">
            <Title className="mb-4 text-center border-b pb-3 text-black font-bold">Perturbation émotionnelle vs Global</Title>
            <div className="h-[450px]">
              <Radar data={group3RadarData} options={radarOptions} />
            </div>
          </Card>

          {/* Group 4 Radar - Souvenirs traumatisants */}
          <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow bg-white border border-gray-100 rounded-lg overflow-hidden">
            <Title className="mb-4 text-center border-b pb-3 text-black font-bold">Souvenirs traumatisants vs Global</Title>
            <div className="h-[450px]">
              <Radar data={group4RadarData} options={radarOptions} />
            </div>
          </Card>
        </div>

        <Card className="p-6 mt-8 border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-white">
          <Title className="mb-2 text-center">Guide d&apos;Interprétation</Title>
          <div className="prose mx-auto max-w-3xl">
            <ul className="list-disc pl-6 space-y-2">
              <li><span className="font-semibold">Perturbation psychosomatique</span>: Manifestations physiques résultant du stress psychologique.</li>
              <li><span className="font-semibold">Perturbation cognitive</span>: Difficultés liées à la concentration, la mémoire et la prise de décision.</li>
              <li><span className="font-semibold">Perturbation émotionnelle</span>: Changements dans la régulation des émotions et l&apos;humeur.</li>
              <li><span className="font-semibold">Souvenirs traumatisants</span>: Reviviscences et pensées intrusives liées aux événements traumatiques.</li>
            </ul>
            <p className="mt-4 text-sm text-gray-600">
              Les écarts significatifs entre les scores globaux et les scores spécifiques peuvent indiquer des domaines nécessitant une attention particulière.
            </p>
          </div>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-500">No statistics available</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        Retour
      </button>

      <Card className="mb-8">
        <div className="text-center p-6">
          <Title>Statistiques Globales</Title>
          <Text className="text-4xl font-bold mt-2">
            {stats.totalSubmissions} Soumissions
          </Text>
        </div>
      </Card>

      <TabGroup onIndexChange={setActiveTab}>
        <TabList className="mb-8">
          <Tab>Démographie</Tab>
          <Tab>Questions</Tab>
          <Tab>Tableau</Tab>
          <Tab>Global</Tab>
          <Tab>Custom</Tab>
          <Tab>Radar</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <DemographicsSection />
          </TabPanel>
          <TabPanel>
            <div className="space-y-6">
              {stats.questions.map((question: any) => (
                <QuestionSection key={question.questionId} question={question} />
              ))}
            </div>
          </TabPanel>
          <TabPanel>
            <TableauSection />
          </TabPanel>
          <TabPanel>
            <GlobalSection />
          </TabPanel>
          <TabPanel>
            <CustomSection />
          </TabPanel>
          <TabPanel>
            <RadarSection />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
} 