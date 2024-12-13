// local.ts
export interface Local {
    Id: string;
    Name: string;
    StoreId: string;
    BrandId: string;
    LocalGroupId: string;
    needReset?: boolean; // Atributo adicional
}
