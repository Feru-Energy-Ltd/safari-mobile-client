import { authenticatedFetch } from './auth.service';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface WalletInfo {
    id: number;
    accountBalance: number;
    accountNumber: string;
    active: boolean;
    ownerId: number;
    ownerEmail: string;
    createdAt?: number[]; // [year, month, day, hour, minute, second]
}

export interface Transaction {
    id: number;
    accountNumber: string;
    transactedAmount: number;
    referenceId: string;
    transactionId: string | null;
    type: 'CREDIT' | 'DEBIT' | 'REFUND' | string;
    status: 'SUCCESSFUL' | 'PENDING' | 'FAILED' | 'COMPLETED' | string;
    createdAt: number[];
}

export interface TransactionResponse {
    content: Transaction[];
    pageable?: {
        pageNumber: number;
        pageSize: number;
        totalElements: number;
        totalPages: number;
        last: boolean;
    };
    totalElements?: number;
    totalPages?: number;
    last?: boolean;
    numberOfElements?: number;
    size?: number;
    number?: number;
}

export interface PaymentProvider {
    code: string;
    name: string;
    iconKey: string;
}

export interface TopUpRequest {
    amount: number;
    phoneNumber: string;
    providerCode: string;
}

export interface TopUpResponse {
    status: boolean;
    data: any;
    code: number;
    message: string;
}

export async function getWalletBalance(): Promise<WalletInfo> {
    return authenticatedFetch<WalletInfo>(`${BASE_URL}/payment/wallets/me`);
}

export async function getTransactions(accountNumber: string, page: number = 0, size: number = 20): Promise<TransactionResponse> {
    return authenticatedFetch<TransactionResponse>(
        `${BASE_URL}/payment/wallets/accounts/${accountNumber}/transactions?page=${page}&size=${size}`
    );
}

export async function getRecentTransactions(accountNumber: string): Promise<TransactionResponse | Transaction[]> {
    return authenticatedFetch<TransactionResponse | Transaction[]>(
        `${BASE_URL}/payment/wallets/accounts/${accountNumber}/transactions/recents`
    );
}

export async function topUpWallet(payload: TopUpRequest): Promise<TopUpResponse> {
    return authenticatedFetch<TopUpResponse>(`${BASE_URL}/payment/wallets/topup`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function getPaymentProviders(): Promise<PaymentProvider[]> {
    return authenticatedFetch<PaymentProvider[]>(`${BASE_URL}/payment/wallets/payment-providers`);
}
