import { useAppSelector as useSelector } from '@/store/hooks';
import ModalError from './ModalError';

export default function ModalErrorWrapper() {
  const modalData = useSelector((state) => state.ui.errorModal);
  return (
    <ModalError
      openModal={modalData.openModal}
      message={modalData.message}
      title={modalData.title}
    />
  );
}
