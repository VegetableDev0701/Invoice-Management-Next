import { useAppSelector as useSelector } from '@/store/hooks';

export const usePageData = (
  slice: 'data' | 'projects',
  category: string,
  subCategory?: string,
  subSubCategory?: string
) => {
  const categoryData = useSelector(
    (state) => {
      console.log('check state state', state);
      return (state as any)[slice]?.[category];
    } 
  );

  console.log('check state, categoryData', categoryData)
  const data =
    subSubCategory && subCategory
      ? categoryData?.[subCategory]?.[subSubCategory]
      : subCategory && !subSubCategory
      ? categoryData?.[subCategory]
      : categoryData;
  console.log('check state, data', data)
  const isLoading = data === undefined;
  return { data, isLoading };
};
