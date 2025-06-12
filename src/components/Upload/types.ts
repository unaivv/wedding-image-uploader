import type { FileType } from "rsuite/esm/Uploader"

export interface IUploadProps {
    onlyButton?: boolean
    extraParams?: Record<string, string>
    onUpload?: (files: FileType[]) => void
}