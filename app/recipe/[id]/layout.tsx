import type { Metadata } from 'next';
import { getRecipe } from './getRecipe';

type Params = { params: { id: string } };

function buildDescription(recipe: { title: string; introduction?: string }): string {
  const text =
    recipe.introduction?.trim() ||
    `Receita de ${recipe.title} criada com inteligência artificial pelo Chefinho IA.`;
  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const canonical = `/recipe/${params.id}`;
  const recipe = await getRecipe(params.id);

  if (!recipe) {
    return {
      title: 'Receita | Chefinho IA',
      alternates: { canonical },
    };
  }

  const description = buildDescription(recipe);

  return {
    title: `${recipe.title} | Chefinho IA`,
    description,
    alternates: { canonical },
    openGraph: {
      title: recipe.title,
      description,
      type: 'article',
      url: canonical,
      ...(recipe.imageUrl ? { images: [recipe.imageUrl] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: recipe.title,
      description,
      ...(recipe.imageUrl ? { images: [recipe.imageUrl] } : {}),
    },
  };
}

export default async function RecipeIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const recipe = await getRecipe(params.id);

  const jsonLd = recipe
    ? {
        '@context': 'https://schema.org',
        '@type': 'Recipe',
        name: recipe.title,
        ...(recipe.introduction ? { description: recipe.introduction } : {}),
        ...(recipe.imageUrl ? { image: recipe.imageUrl } : {}),
        author: { '@type': 'Organization', name: 'Chefinho IA' },
        ...(recipe.createdAt?.seconds
          ? { datePublished: new Date(recipe.createdAt.seconds * 1000).toISOString() }
          : {}),
        ...(recipe.ingredients?.length ? { recipeIngredient: recipe.ingredients } : {}),
        ...(recipe.preparationMethod?.length
          ? {
              recipeInstructions: recipe.preparationMethod.map((step, i) => ({
                '@type': 'HowToStep',
                position: i + 1,
                text: step,
              })),
            }
          : {}),
        ...(recipe.nutritionalInfo
          ? {
              nutrition: {
                '@type': 'NutritionInformation',
                ...(recipe.nutritionalInfo.calorias ? { calories: recipe.nutritionalInfo.calorias } : {}),
                ...(recipe.nutritionalInfo.proteinas ? { proteinContent: recipe.nutritionalInfo.proteinas } : {}),
                ...(recipe.nutritionalInfo.carboidratos ? { carbohydrateContent: recipe.nutritionalInfo.carboidratos } : {}),
                ...(recipe.nutritionalInfo.gorduras ? { fatContent: recipe.nutritionalInfo.gorduras } : {}),
                ...(recipe.nutritionalInfo.fibras ? { fiberContent: recipe.nutritionalInfo.fibras } : {}),
              },
            }
          : {}),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
