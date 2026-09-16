import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import Modal from 'react-modal';
import type { Styles } from 'react-modal';
import styled from 'styled-components';

import { MOBILE_LAYOUT_MAX_WIDTH_PX } from '../utilities/activityDetailGesture';

const desktopStyleOverrides: Styles = {
  overlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  content: {
    bottom: 'unset',
    overflow: 'visible',
    padding: 0,
    border: 'none',
    borderRadius: 0,
    position: 'static',
    background: 'none',
    pointerEvents: 'none',
  },
};

const sheetStyleOverrides: Styles = {
  overlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  content: {
    inset: 'unset',
    top: 'unset',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'visible',
    padding: 0,
    border: 'none',
    borderRadius: 0,
    position: 'absolute',
    background: 'none',
    pointerEvents: 'none',
    width: '100%',
  },
};

const ActualContent = styled.div<{ $sheet: boolean; $wide?: boolean }>`
  border-radius: ${props => (props.$sheet ? '12px 12px 0 0' : '4px')};
  background: white;
  border: 1px solid rgb(204, 204, 204);
  padding: ${props => (props.$sheet ? '12px 16px' : '10px')};
  padding-bottom: ${props => (
    props.$sheet
      ? 'max(16px, env(safe-area-inset-bottom, 0px))'
      : '10px'
  )};
  pointer-events: all;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.2);
  overflow: auto;
  max-height: ${props => (props.$sheet ? 'min(88dvh, 100%)' : 'min(80vh, 640px)')};
  max-width: ${props => {
    if (props.$sheet) return '100%';
    if (props.$wide) return 'min(90vw, 640px)';
    return 'min(90vw, 420px)';
  }};
  width: ${props => (props.$sheet ? '100%' : 'auto')};
  -webkit-overflow-scrolling: touch;
`;

interface Props {
  children: ReactNode;
  contentLabel?: string;
  isOpen: boolean;
  onRequestClose: () => unknown;
  wide?: boolean;
}

function useSheetLayout(): boolean {
  const query = useMemo(
    () => `(max-width: ${MOBILE_LAYOUT_MAX_WIDTH_PX}px)`,
    [],
  );
  const [sheet, setSheet] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    try {
      return window.matchMedia(query).matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    let media: MediaQueryList;
    try {
      media = window.matchMedia(query);
    } catch {
      return undefined;
    }
    const sync = () => setSheet(media.matches);
    sync();
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', sync);
      return () => media.removeEventListener('change', sync);
    }
    media.addListener(sync);
    return () => media.removeListener(sync);
  }, [query]);

  return sheet;
}

const AppModal = ({
  isOpen,
  children,
  onRequestClose,
  contentLabel = 'Dialog',
  wide = false,
}: Props) => {
  const sheet = useSheetLayout();

  return (
    <Modal
      contentLabel={contentLabel}
      onRequestClose={onRequestClose}
      isOpen={isOpen}
      style={sheet ? sheetStyleOverrides : desktopStyleOverrides}
    >
      <ActualContent $sheet={sheet} $wide={wide} data-app-modal-sheet={sheet ? 'true' : 'false'}>
        {children}
      </ActualContent>
    </Modal>
  );
};

export default AppModal;
