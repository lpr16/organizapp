package com.organizapp.core.port;

import com.organizapp.core.domain.FinanceTransaction;

import java.util.List;
import java.util.Optional;

public interface FinanceRepository {
    List<FinanceTransaction> listTransactions();
    Optional<FinanceTransaction> getTransaction(String transactionId);
    FinanceTransaction createTransaction(FinanceTransaction transaction);
    FinanceTransaction updateTransaction(FinanceTransaction transaction);
    boolean deleteTransaction(String transactionId);
}
