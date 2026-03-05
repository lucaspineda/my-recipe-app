'use client';
import MealForm from '../components/MealForm/MealForm';

import React, { useEffect } from 'react';
import { trackPageVisit } from '../lib/analytics';

const RecipePage = () => {
  useEffect(() => {
    trackPageVisit('recipe-creation');
  }, []);

  return (
    <div className="flex justify-center">
      <MealForm />
    </div>
  );
};

export default RecipePage;
