import { authenticatedFetch } from './auth.service';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface WalletInfo {
    id: number;
    accountBalance: number;
    accountNumber: string;
    active: boolean;
    ownerId: number;
    ownerEmail: string;
}

export interface WalletBalanceResponse {
    status: boolean;
    data: WalletInfo;
    code: number;
    message: string;
}

export interface Transaction {
    transactionDate: string;
    transactionId: string;
    amount: string;
    account: string;
    type: 'CREDIT' | 'DEBIT';
    status: 'SUCCESSFUL' | 'PENDING' | 'FAILED';
}

export interface TransactionResponse {
    content: Transaction[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        totalElements: number;
        totalPages: number;
        last: boolean;
    };
    totalElements: number;
    totalPages: number;
    last: boolean;
    numberOfElements: number;
    size: number;
    number: number;
}

export interface TopUpRequest {
    amount: number;
    phoneNumber: string;
}

export interface TopUpResponse {
    status: boolean;
    data: {
        amount: string;
        currency: string;
        externalId: string;
        payer: {
            partyIdType: string;
            partyId: string;
        };
        payerMessage: string;
        payeeNote: string;
        status: string;
        reason: string;
    };
    code: number;
    message: string;
}

export async function getWalletBalance(): Promise<WalletInfo> {
    const response = await authenticatedFetch<WalletBalanceResponse>(`${BASE_URL}/csms/app/wallets/me`);
    return response.data;
}

export async function getTransactions(accountNumber: string, page: number = 0, size: number = 20): Promise<TransactionResponse> {
    return authenticatedFetch<TransactionResponse>(
        `${BASE_URL}/csms/app/wallets/accounts/${accountNumber}/transactions?page=${page}&size=${size}`
    );
}

export async function topUpWallet(payload: TopUpRequest): Promise<TopUpResponse> {
    return authenticatedFetch<TopUpResponse>(`${BASE_URL}/csms/app/wallets/topup`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}
