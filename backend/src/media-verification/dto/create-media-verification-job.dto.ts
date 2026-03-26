import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMediaVerificationJobDto {
  @IsString()
  @IsIn(['document_ocr', 'biometric_face_match'])
  verificationType: string;

  @IsOptional()
  @IsString()
  subjectRole?: string;

  @IsOptional()
  @IsString()
  subjectProfileId?: string;

  @IsString()
  sampleKey: string;

  @IsOptional()
  @IsArray()
  inputAssets?: Array<Record<string, unknown>>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
