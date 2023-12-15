import FullScreenLoader from '@/components/UI/Loaders/FullScreenLoader';
import useInitLoadData from '@/hooks/use-load-company-data';
import { useAppSelector as useSelector } from '@/store/hooks';

const InitialLoadWrapper = ({ children }: { children: React.ReactNode }) => {
  const { userLoading } = useInitLoadData();
  const isLoading = useSelector((state) => state.ui.lockUI);
  return (
    <>
      {userLoading && (
        <div className="flex h-screen items-center justify-center">
          <FullScreenLoader color="var(--stak-dark-green)" size={100} />
        </div>
      )}
      {!userLoading && (
        <>
          {isLoading && (
            <FullScreenLoader className="fixed top-0 z-50 w-full bg-[#FFFFFFAA]" />
          )}
          {children}
        </>
      )}
    </>
  );
};

export default InitialLoadWrapper;
