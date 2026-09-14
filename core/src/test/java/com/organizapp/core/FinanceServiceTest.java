package com.organizapp.core;

import com.organizapp.core.domain.FinanceTransaction;
import com.organizapp.core.domain.TransactionType;
import com.organizapp.core.service.FinanceService;
import com.organizapp.core.storage.SqliteBoardRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FinanceServiceTest {

    private FinanceService service;

    @BeforeEach
    void setUp() {
        String uniqueDb = "jdbc:sqlite:file:findb_" + UUID.randomUUID() + "?mode=memory&cache=shared";
        SqliteBoardRepository repository = new SqliteBoardRepository(uniqueDb);
        service = new FinanceService(repository);
    }

    @Test
    void shouldStartWithNoTransactions() {
        assertThat(service.listTransactions()).isEmpty();
    }

    @Test
    void shouldCreateUpdateAndDeleteTransaction() {
        FinanceTransaction created = service.createTransaction(
                "2026-09-14",
                "Groceries",
                4599L,
                TransactionType.EXPENSE,
                "Food",
                "Weekly shop"
        );

        assertThat(created.id()).isNotBlank();
        assertThat(created.amountCents()).isEqualTo(4599L);
        assertThat(created.type()).isEqualTo(TransactionType.EXPENSE);
        assertThat(created.category()).isEqualTo("Food");
        assertThat(service.listTransactions()).hasSize(1);

        FinanceTransaction updated = service.updateTransaction(
                created.id(),
                "2026-09-15",
                "Salary",
                250000L,
                TransactionType.INCOME,
                "Income",
                ""
        );

        assertThat(updated.description()).isEqualTo("Salary");
        assertThat(updated.type()).isEqualTo(TransactionType.INCOME);
        assertThat(updated.occurredOn()).isEqualTo("2026-09-15");

        assertThat(service.deleteTransaction(created.id())).isTrue();
        assertThat(service.getTransaction(created.id())).isEmpty();
    }

    @Test
    void shouldDefaultBlankCategoryToOther() {
        FinanceTransaction created = service.createTransaction(
                "2026-09-14",
                "Misc",
                100L,
                TransactionType.EXPENSE,
                "  ",
                null
        );
        assertThat(created.category()).isEqualTo(FinanceTransaction.DEFAULT_CATEGORY);
        assertThat(created.notes()).isEmpty();
    }

    @Test
    void shouldRejectBlankDescriptionAndNonPositiveAmount() {
        assertThatThrownBy(() -> service.createTransaction("2026-09-14", "  ", 100L, TransactionType.EXPENSE, "Food", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("description");

        assertThatThrownBy(() -> service.createTransaction("2026-09-14", "Rent", 0L, TransactionType.EXPENSE, "Housing", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("amount");

        assertThatThrownBy(() -> service.createTransaction("14/09/2026", "Rent", 100L, TransactionType.EXPENSE, "Housing", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("YYYY-MM-DD");
    }
}
