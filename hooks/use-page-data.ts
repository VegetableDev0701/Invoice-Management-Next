import { useAppSelector as useSelector } from '@/store/hooks';

export const usePageData = (
  slice: 'data' | 'projects',
  category: string,
  subCategory?: string,
  subSubCategory?: string
) => {
  const data =
    subSubCategory && subCategory
      ? useSelector(
          (state) =>
            (state as any)[slice]?.[category]?.[subCategory]?.[subSubCategory]
        )
      : subCategory && !subSubCategory
      ? // TODO fix this `any` bullshit
        useSelector((state) => (state as any)[slice]?.[category]?.[subCategory])
      : useSelector((state) => (state as any)[slice]?.[category]);

  const isLoading = data === undefined;
  return { data, isLoading };
};
