export const MEDIA_VERIFICATION_SAMPLE_CATALOG: Record<
  string,
  {
    verificationType: 'document_ocr' | 'biometric_face_match';
    inputAssets: Array<Record<string, unknown>>;
    extractedData: Record<string, unknown>;
    confidenceScore: number;
    matched?: boolean;
    reviewRequired?: boolean;
    notes: string;
  }
> = {
  'guardian-id-front': {
    verificationType: 'document_ocr',
    inputAssets: [
      {
        label: 'RG ficticio frente',
        fixturePath: '/Volumes/SSDExterno/Desenvolvimento/Leggau/docs/test-fixtures/ocr/guardian-id-front.svg',
      },
    ],
    extractedData: {
      documentType: 'national_id',
      fullName: 'Helena Dantas',
      documentNumber: '1234567890',
      birthDate: '1988-07-14',
      issuingAuthority: 'SSP-PB',
    },
    confidenceScore: 0.99,
    notes: 'OCR simulou extração completa do documento frontal.',
  },
  'guardian-id-back': {
    verificationType: 'document_ocr',
    inputAssets: [
      {
        label: 'RG ficticio verso',
        fixturePath: '/Volumes/SSDExterno/Desenvolvimento/Leggau/docs/test-fixtures/ocr/guardian-id-back.svg',
      },
    ],
    extractedData: {
      cpf: '12345678901',
      motherName: 'Rita Dantas',
      fatherName: 'Marcos Dantas',
    },
    confidenceScore: 0.97,
    notes: 'OCR simulou extração do verso com parentesco e CPF.',
  },
  'guardian-face-match-positive': {
    verificationType: 'biometric_face_match',
    inputAssets: [
      {
        label: 'Selfie ficticia responsavel',
        fixturePath: '/Volumes/SSDExterno/Desenvolvimento/Leggau/docs/test-fixtures/biometric/guardian-face-a.svg',
      },
      {
        label: 'Documento ficticio responsavel',
        fixturePath: '/Volumes/SSDExterno/Desenvolvimento/Leggau/docs/test-fixtures/biometric/guardian-face-b.svg',
      },
    ],
    extractedData: {
      faceModel: 'mock-guardian-face-a-v1',
      comparisonModel: 'mock-guardian-face-b-v1',
    },
    confidenceScore: 0.98,
    matched: true,
    notes: 'Biometria simulou match positivo entre selfie e documento.',
  },
  'guardian-face-match-negative': {
    verificationType: 'biometric_face_match',
    inputAssets: [
      {
        label: 'Selfie ficticia responsavel',
        fixturePath: '/Volumes/SSDExterno/Desenvolvimento/Leggau/docs/test-fixtures/biometric/guardian-face-a.svg',
      },
      {
        label: 'Impostor ficticio',
        fixturePath: '/Volumes/SSDExterno/Desenvolvimento/Leggau/docs/test-fixtures/biometric/guardian-face-impostor.svg',
      },
    ],
    extractedData: {
      faceModel: 'mock-guardian-face-a-v1',
      comparisonModel: 'mock-impostor-face-v1',
    },
    confidenceScore: 0.22,
    matched: false,
    reviewRequired: true,
    notes: 'Biometria simulou mismatch e escalonou revisão manual.',
  },
};
