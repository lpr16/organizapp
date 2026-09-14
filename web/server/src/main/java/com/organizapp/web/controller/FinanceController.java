package com.organizapp.web.controller;

import com.organizapp.core.domain.FinanceTransaction;
import com.organizapp.core.domain.TransactionType;
import com.organizapp.core.service.FinanceService;
import com.organizapp.web.dto.CreateFinanceTransactionRequest;
import com.organizapp.web.dto.UpdateFinanceTransactionRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/finance/transactions")
public class FinanceController {
    private final FinanceService financeService;

    public FinanceController(FinanceService financeService) {
        this.financeService = financeService;
    }

    @GetMapping
    public ResponseEntity<List<FinanceTransaction>> listTransactions() {
        return ResponseEntity.ok(financeService.listTransactions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FinanceTransaction> getTransaction(@PathVariable String id) {
        return financeService.getTransaction(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<FinanceTransaction> createTransaction(
            @Valid @RequestBody CreateFinanceTransactionRequest request) {
        FinanceTransaction created = financeService.createTransaction(
                request.occurredOn(),
                request.description(),
                request.amountCents(),
                TransactionType.fromString(request.type()),
                request.category(),
                request.notes()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FinanceTransaction> updateTransaction(
            @PathVariable String id,
            @Valid @RequestBody UpdateFinanceTransactionRequest request) {
        return ResponseEntity.ok(financeService.updateTransaction(
                id,
                request.occurredOn(),
                request.description(),
                request.amountCents(),
                TransactionType.fromString(request.type()),
                request.category(),
                request.notes()
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable String id) {
        boolean deleted = financeService.deleteTransaction(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
