'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import confetti from 'canvas-confetti';
import { z } from "zod";
import { toast } from 'react-hot-toast';
import { fetchQuestions, fetchResponses, submitQuiz } from '@/app/actions/quiz';

const departments = ['SAMU', 'Urgence', 'Réanimation', 'USIC'];

// Types from dashboard
type Question = {
  id: string;
  question_text: string;
  created_at: string;
  updated_at: string;
};

type Response = {
  id: string;
  response_text: string;
  created_at: string;
  updated_at: string;
};

type Answer = {
  questionId: string;
  responseId: string;
};

type PatientFormData = {
  age: number;
  sex: string;
  state: string;
  nbChilds: number;
  expYears: number;
  service: string;
  expYearsC: number;
  answers: Answer[];
};

// Validation schema
const patientFormSchema = z.object({
  age: z.number().min(18, "Age must be at least 18").max(100, "Age must be less than 100"),
  sex: z.string().min(1, "Sex is required"),
  state: z.string().min(1, "État civil is required"),
  nbChilds: z.number().min(0, "Nombre d'enfants is required"),
  expYears: z.number().min(0, "Années d'expérience is required"),
  service: z.string().min(1, "Service is required"),
  expYearsC: z.number().min(0, "Années d'expérience dans le service actuel is required")
});

const preventWheelChange = (e: React.WheelEvent<HTMLInputElement>) => {
  e.currentTarget.blur();
};

const questionVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
};

export default function PublicQuiz() {
  const [showPatientModal, setShowPatientModal] = useState(true); // Start with patient modal open
  const [showQuiz, setShowQuiz] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [[page, direction], setPage] = useState([0, 0]);
  
  const [formData, setFormData] = useState<PatientFormData>({
    age: '' as unknown as number,
    sex: '',
    state: '',
    nbChilds: '' as unknown as number,
    expYears: '' as unknown as number,
    service: '',
    expYearsC: '' as unknown as number,
    answers: []
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PatientFormData, string>>>({});

  const validatePatientForm = () => {
    try {
      patientFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Partial<Record<keyof PatientFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0] as keyof PatientFormData] = err.message;
          }
        });
        setErrors(formattedErrors);
      }
      return false;
    }
  };

  const fetchQuestionsAndResponses = async () => {
    setIsLoading(true);
    try {
      const [questionsRes, responsesRes] = await Promise.all([
        fetchQuestions('public_access'),
        fetchResponses('public_access')
      ]);

      if (questionsRes.error) {
        toast.error(questionsRes.message || 'Failed to fetch questions');
        return;
      }

      if (responsesRes.error) {
        toast.error(responsesRes.message || 'Failed to fetch responses');
        return;
      }

      setQuestions(questionsRes.data);
      setResponses(responsesRes.data);
      setShowQuiz(true);
    } catch (error) {
      toast.error('Failed to load quiz data');
      console.error('Error fetching quiz data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientInfoSubmit = async () => {
    if (!validatePatientForm()) {
      toast.error("Please fill all required fields correctly");
      return;
    }
    setShowPatientModal(false);
    setShowQuiz(true);
    await fetchQuestionsAndResponses();
  };

  const handleAnswer = (questionId: string, responseId: string) => {
    setFormData(prev => ({
      ...prev,
      answers: [
        ...prev.answers.filter(a => a.questionId !== questionId),
        { questionId, responseId }
      ]
    }));
  };

  const handleInputChange = (field: keyof PatientFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === '' ? '' : value
    }));
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setPage([page + 1, 1]);
      setCurrentQuestion(curr => curr + 1);
    } else {
      try {
        setIsLoading(true);
        const result = await submitQuiz('public_access', formData);
        
        if (result.error) {
          toast.error(result.message || 'Failed to submit quiz');
          return;
        }

        setShowQuiz(false);
        setShowThankYou(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (error) {
        toast.error('Failed to submit quiz');
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setPage([page - 1, -1]);
      setCurrentQuestion(curr => curr - 1);
    }
  };

  const handleReturnToStart = () => {
    setShowThankYou(false);
    setShowPatientModal(true);
    setCurrentQuestion(0);
    setFormData({
      age: '' as unknown as number,
      sex: '',
      state: '',
      nbChilds: '' as unknown as number,
      expYears: '' as unknown as number,
      service: '',
      expYearsC: '' as unknown as number,
      answers: []
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Test d’usure de compassion (TUC)
        </h1>

        {/* Patient Information Modal */}
        <Dialog open={showPatientModal} onOpenChange={setShowPatientModal}>
          <DialogContent className="w-[95%] max-w-[425px]">
            <DialogHeader className="sticky top-0 mt-4 z-10 pb-4 border-b">
              <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Informations utilisateur
              </DialogTitle>
              <DialogDescription className="text-base text-gray-500 dark:text-gray-400 mt-2">
                Veuillez fournir les informations suivantes avant de commencer le quiz.
              </DialogDescription>
            </DialogHeader>
            {/* Rest of the patient form - same as dashboard */}
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="grid gap-4 py-4 px-2 sm:px-4">
                {/* Age Input */}
                <div className="grid gap-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age === null ? '' : formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value ? parseInt(e.target.value) : '')}
                    className={errors.age ? 'border-red-500' : ''}
                  />
                  {errors.age && <p className="text-sm text-red-500">{errors.age}</p>}
                </div>

                {/* Sex Radio Group */}
                <div className="grid gap-2">
                  <Label>Sex *</Label>
                  <RadioGroup
                    value={formData.sex}
                    onValueChange={(value) => handleInputChange('sex', value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Homme" id="homme" />
                      <Label htmlFor="homme">Homme</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Femme" id="femme" />
                      <Label htmlFor="femme">Femme</Label>
                    </div>
                  </RadioGroup>
                </div>
                {errors.sex && <p className="text-sm text-red-500">{errors.sex}</p>}

                {/* État Civil Radio Group */}
                <div className="grid gap-2">
                  <Label>État Civil *</Label>
                  <RadioGroup
                    value={formData.state}
                    onValueChange={(value) => handleInputChange('state', value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Marié" id="marie" />
                      <Label htmlFor="marie">Marié</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Célibataire" id="celibataire" />
                      <Label htmlFor="celibataire">Célibataire</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Divorcé" id="divorce" />
                      <Label htmlFor="divorce">Divorcé</Label>
                    </div>
                  </RadioGroup>
                </div>
                {errors.state && <p className="text-sm text-red-500">{errors.state}</p>}

                {/* Number of Children Input */}
                <div className="grid gap-2">
                  <Label htmlFor="nbChilds">Nombre d&apos;enfants *</Label>
                  <Input
                    id="nbChilds"
                    type="number"
                    value={formData.nbChilds === null ? '' : formData.nbChilds}
                    onChange={(e) => handleInputChange('nbChilds', e.target.value ? parseInt(e.target.value) : '')}
                    onWheel={preventWheelChange}
                    className={errors.nbChilds ? 'border-red-500' : ''}
                  />
                  {errors.nbChilds && <p className="text-sm text-red-500">{errors.nbChilds}</p>}
                </div>

                {/* Years of Experience Input */}
                <div className="grid gap-2">
                  <Label htmlFor="expYears">Années d&apos;expérience *</Label>
                  <Input
                    id="expYears"
                    type="number"
                    value={formData.expYears === null ? '' : formData.expYears}
                    onChange={(e) => handleInputChange('expYears', e.target.value ? parseInt(e.target.value) : '')}
                    onWheel={preventWheelChange}
                    className={errors.expYears ? 'border-red-500' : ''}
                  />
                  {errors.expYears && <p className="text-sm text-red-500">{errors.expYears}</p>}
                </div>

                {/* Service Toggle Group */}
                <div className="grid gap-2">
                  <Label>Service *</Label>
                  <ToggleGroup
                    type="single"
                    value={formData.service}
                    onValueChange={(value) => value && handleInputChange('service', value)}
                    className={`flex flex-wrap gap-2 ${errors.service ? 'border-red-500' : ''}`}
                  >
                    {departments.map((dept) => (
                      <ToggleGroupItem
                        key={dept}
                        value={dept}
                        aria-label={dept}
                        className="flex-1 min-w-[120px] data-[state=on]:bg-blue-500 data-[state=on]:text-white"
                      >
                        {dept}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
                {errors.service && <p className="text-sm text-red-500">{errors.service}</p>}

                {/* Years in Current Service Input */}
                <div className="grid gap-2">
                  <Label htmlFor="expYearsC">Années d&apos;expérience dans le service actuel *</Label>
                  <Input
                    id="expYearsC"
                    type="number"
                    value={formData.expYearsC === null ? '' : formData.expYearsC}
                    onChange={(e) => handleInputChange('expYearsC', e.target.value ? parseInt(e.target.value) : '')}
                    onWheel={preventWheelChange}
                    className={errors.expYearsC ? 'border-red-500' : ''}
                  />
                  {errors.expYearsC && <p className="text-sm text-red-500">{errors.expYearsC}</p>}
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 py-4">
              <Button onClick={handlePatientInfoSubmit} className="w-full">Démarrer le quiz</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Quiz Modal */}
        <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
          <DialogContent className="w-[95%] max-w-[425px]">
            {isLoading ? (
              <>
                <DialogHeader>
                  <DialogTitle className="sr-only">Chargement du quiz</DialogTitle>
                </DialogHeader>
                <div className="py-12 text-center">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                  <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">Chargement des questions...</p>
                </div>
              </>
            ) : questions.length > 0 ? (
              <>
                <DialogHeader>
                  <DialogTitle>Question {currentQuestion + 1}</DialogTitle>
                  <Progress
                    value={(currentQuestion / questions.length) * 100}
                    className="w-full h-2"
                  />
                </DialogHeader>
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={page}
                    custom={direction}
                    variants={questionVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 }
                    }}
                    className="py-4 px-2 sm:px-4"
                  >
                    <h3 className="text-lg font-medium mb-4">
                      {questions[currentQuestion]?.question_text}
                    </h3>
                    <div className="space-y-2">
                      {responses.map((response) => (
                        <motion.div
                          key={response.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Button
                            variant={
                              formData.answers.some(
                                answer => 
                                  answer.questionId === questions[currentQuestion]?.id && 
                                  answer.responseId === response.id
                              ) ? "default" : "outline"
                            }
                            className="w-full justify-start text-left"
                            onClick={() => handleAnswer(
                              questions[currentQuestion].id,
                              response.id
                            )}
                          >
                            {response.response_text}
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
                <div className="flex justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentQuestion === 0}
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!formData.answers.some(
                      answer => answer.questionId === questions[currentQuestion]?.id
                    )}
                  >
                    {currentQuestion === questions.length - 1 ? 'Terminer' : 'Suivant'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="sr-only">Erreur lors du chargement du quiz</DialogTitle>
                </DialogHeader>
                <div className="py-12 text-center">
                  <p className="text-lg text-red-500">Échec du chargement des questions. Veuillez réessayer.</p>
                  <Button onClick={() => setShowQuiz(false)} className="mt-4">
                    Fermer
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Thank You Modal */}
        <Dialog open={showThankYou} onOpenChange={setShowThankYou}>
          <DialogContent className="w-[95%] max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Quiz terminé</DialogTitle>
            </DialogHeader>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="py-8"
            >
              <h2 className="text-3xl font-bold mb-4 text-blue-600 dark:text-blue-400">
                Merci!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Votre réponse a été enregistrée avec succès.
              </p>
              <Button onClick={handleReturnToStart}>
                Démarrer un nouveau quiz
              </Button>
            </motion.div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
