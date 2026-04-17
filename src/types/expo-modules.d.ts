declare module "expo-blur" {
  import { ReactNode } from "react";
    import { ViewProps } from "react-native";

  export interface BlurViewProps extends ViewProps {
    intensity?: number;
    tint?: "light" | "dark" | "default";
    children?: ReactNode;
  }

  export const BlurView: React.FC<BlurViewProps>;
}

declare module "expo-file-system" {
  export interface DirectoryInfo { uri: string; name: string; isDirectory: boolean; modificationTime: number; size: number; };
  export interface FileOptions { encoding?: string };
  export interface DownloadOptions { headers?: Record<string, string>; md5?: boolean; cache?: boolean };
  export interface DownloadResult { uri: string; status: number; headers: Record<string, string>; md5?: string };
  export interface CopyOptions { md5?: boolean };
  export interface CopyResult { uri: string; md5?: string };

  export const StorageAccessFramework: { isAvailable: boolean };
  export const documentDirectory: string;
  export const cacheDirectory: string;
  export const LegacyStorageDirectory: any;

  export function getInfoAsync(uri: string, options?: any): Promise<FileInfo>;
  export function downloadAsync(uri: string, fileUri: string, options?: DownloadOptions): Promise<DownloadResult>;
  export function uploadAsync(uri: string, location: string, options?: any): Promise<any>;
  export function makeDirectoryAsync(uri: string, options?: { intermediates?: boolean }): Promise<void>;
  export function readAsStringAsync(uri: string, options?: { encoding?: string }): Promise<string>;
  export function writeAsStringAsync(uri: string, content: string, options?: { encoding?: string }): Promise<void>;
  export function readDirectoryAsync(uri: string): Promise<string[]>;
  export function getUriForContentUriAsync(uri: string): Promise<string>;

  export const EncodingType: { UTF8: string; Base64: string };

  export interface FileInfo { exists: boolean; isDirectory: boolean; uri: string; modificationTime?: number; size?: number; md5?: string };

  export function writeAsStringAsync(uri: string, content: string, options?: any): Promise<void>;
  export function copyAsync(options: { from: string; to: string }): Promise<void>;
  export function deleteAsync(uri: string, options?: { idempotent?: boolean }): Promise<void>;
  export function makeDirectoryAsync(uri: string, options?: { intermediates?: boolean }): Promise<void>;
  export function readDirectoryAsync(uri: string): Promise<string[]>;
  export function getInfoAsync(uri: string, options?: any): Promise<FileInfo>;
  export function downloadAsync(uri: string, fileUri: string, options?: any): Promise<DownloadResult>;

  // New File/Directory API (expo-file-system v19+)
  export class Paths {
    static get document(): Directory;
    static get cache(): Directory;
    static get bundle(): Directory;
  }

  export class Directory {
    constructor(...uris: (string | File | Directory)[]);
    get name(): string;
    get exists(): boolean;
    get uri(): string;
    list(): (Directory | File)[];
    create(): void;
    createDirectory(name: string): Directory;
    createFile(name: string, mimeType: string | null): File;
    delete(): void;
  }

  export class File {
    constructor(...uris: (string | File | Directory)[]);
    get name(): string;
    get extension(): string;
    get exists(): boolean;
    get uri(): string;
    get parentDirectory(): Directory;
    create(): void;
    delete(): void;
    move(destination: Directory | string): void;
  }

  // Exported FileSystem object for legacy usage
  export const FileSystem: {
    downloadAsync: typeof downloadAsync;
    uploadAsync: typeof uploadAsync;
    getUriAsync: (uri: string) => Promise<string>;
    StorageAccessFramework: { isAvailable: boolean };
    documentDirectory: string;
    cacheDirectory: string;
    getInfoAsync: typeof getInfoAsync;
    readAsStringAsync: typeof readAsStringAsync;
    writeAsStringAsync: typeof writeAsStringAsync;
    deleteAsync: typeof deleteAsync;
    makeDirectoryAsync: typeof makeDirectoryAsync;
    readDirectoryAsync: typeof readDirectoryAsync;
    copyAsync: (options: { from: string; to: string }) => Promise<void>;
    EncodingType: { UTF8: string; Base64: string };
  };
}

declare module "expo-file-system/legacy" {
  export * from "expo-file-system";
}

declare module "expo-file-system/next" {
  export class File {
    constructor(parent: any, name: string);
    exists: any;
    size: any;
    uri: any;
    write(content: string): void;
    textSync(): string;
    create(): void;
    delete(): void;
    move(to: any): void;
  }
  export const Paths: { document: any };
}

declare module "expo-haptics" {
  export const NotificationFeedbackType: {
    Success: "Success";
    Warning: "Warning";
    Error: "Error";
  };

  export const ImpactFeedbackStyle: {
    Light: "Light";
    Medium: "Medium";
    Heavy: "Heavy";
    Rigid: "Rigid";
    Soft: "Soft";
  };

  export function selectionAsync(): Promise<void>;
  export function notificationAsync(type: string): Promise<void>;
  export function impactAsync(style: string): Promise<void>;
}

declare module "expo-splash-screen" {
  export function preventAutoHideAsync(): Promise<void>;
  export function hideAsync(): Promise<void>;
}

declare module "expo-image-picker" {
  export const MediaTypeOptions: { All: string; Images: string; Videos: string };
  export const CameraFacing: { front: string; back: string };
  export interface ImagePickerMediaType { images?: string[]; videos?: string[] };
  export interface ImagePickerAsset {
    uri: string;
    width: number;
    height: number;
    mimeType?: string;
    fileType?: string;
    fileName?: string;
  }
  export interface ImagePickerResult {
    canceled: boolean;
    assets: ImagePickerAsset[];
  }
  export function launchImageLibraryAsync(options?: {
    mediaTypes?: MediaTypeOptions;
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
    allowsMultipleSelection?: boolean;
  }): Promise<ImagePickerResult>;
  export function launchCameraAsync(options?: {
    mediaTypes?: MediaTypeOptions;
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  }): Promise<ImagePickerResult>;
  export function requestMediaLibraryPermissionsAsync(): Promise<{ granted?: boolean; status?: string }>;
  export function requestCameraPermissionsAsync(): Promise<{ granted?: boolean; status?: string }>;
}

declare module "expo-web-browser" {
  export const WebBrowserPresentationStyle: { FULL_SCREEN: string; PAGE_SHEET: string };
  export function openBrowserAsync(url: string, options?: {
    presentationStyle?: string;
    toolbarColor?: string;
    webBrowserPresentationStyle?: string;
    [key: string]: any;
  }): Promise<{ type: string }>;
  export function dismiss(): void;
}

declare module "expo-document-picker" {
  export const MediaType: { images: string; pdf: string; allFiles: string };
  export interface DocumentPickerOptions {
    type?: string;
    copyToCacheDirectory?: boolean;
    multiple?: boolean;
  }
  export interface DocumentPickerResult {
    canceled: boolean;
    assets?: { name: string; uri: string; mimeType?: string; size?: number }[];
  }
  export function pickAsync(options?: DocumentPickerOptions | string): Promise<DocumentPickerResult>;
  export function getDocumentAsync(options?: DocumentPickerOptions): Promise<DocumentPickerResult>;
}

declare module "expo-local-authentication" {
  export const AuthenticationType: { [key: number]: string; FINGERPRINT: number; FACE: number; FACIAL_RECOGNITION: number };
  export const SecurityLevel: { SECURE_HARDWARE: number };
  export enum AuthType { FINGERPRINT = 1, FACE = 2, FACIAL_RECOGNITION = 3 }
  export function hasHardwareAsync(options?: any): Promise<boolean>;
  export function isEnrolledAsync(options?: any): Promise<boolean>;
  export function supportedAuthenticationTypesAsync(options?: any): Promise<number[]>;
  export function authenticateAsync(options?: {
    promptMessage?: string;
    disableDeviceFallback?: boolean;
    cancelLabel?: string;
    requireConfirmation?: boolean;
  }): Promise<{ success: boolean; error?: string }>;
}

declare module "expo-image" {
  export interface ImageProps {
    source: string | { uri: string } | any;
    style?: any;
    contentFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
    onLoad?: () => void;
    onError?: (error: { error: string }) => void;
    cachePolicy?: "none" | "disk" | "memory" | "memory-disk";
    [key: string]: any;
  }
  export const Image: React.FC<ImageProps> & { prefetch(uri: string): Promise<void> };
}

declare module "expo-linear-gradient" {
  import { ViewProps } from "react-native";
  export interface LinearGradientProps extends ViewProps {
    colors: string[];
    locations?: number[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
  }
  export const LinearGradient: React.FC<LinearGradientProps>;
}
