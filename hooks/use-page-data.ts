import { useAppSelector as useSelector } from '@/store/hooks';

export const usePageData = (
  slice: 'data' | 'projects',
  category: string,
  subCategory?: string,
  subSubCategory?: string
) => {
  const categoryData = useSelector(
    (state) => (state as any)[slice]?.[category]
  );
  const data =
    subSubCategory && subCategory
      ? categoryData?.[subCategory]?.[subSubCategory]
      : subCategory && !subSubCategory
      ? categoryData?.[subCategory]
      : categoryData;

  const isLoading = data === undefined;
  return { data, isLoading };
};
