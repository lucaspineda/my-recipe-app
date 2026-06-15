'use client';
import MealForm from '../components/MealForm/MealForm';

import React, { useEffect, Suspense } from 'react';
import { trackPageVisit } from '../lib/analytics';

const RecipePage = () => {
  useEffect(() => {
    trackPageVisit('recipe-creation');
  }, []);

  return (
    <div className="flex justify-center">
      <Suspense fallback={null}>
        <MealForm />
      </Suspense>
    </div>
  );
};

export default RecipePage;
