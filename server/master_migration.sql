UPDATE documents SET pattern_code='STE-S-025-B0-20-P-01-00' WHERE pattern_code='STE-S-015-B0-20-P-01-00';
UPDATE consolidated_reports SET pattern_code='STE-S-025-B0-20-P-01-00' WHERE pattern_code='STE-S-015-B0-20-P-01-00';

/*
SELECT * FROM trial_cards WHERE pattern_code NOT IN (SELECT pattern_code FROM master_card);
SELECT * FROM documents WHERE pattern_code NOT IN (SELECT pattern_code FROM master_card);
SELECT * FROM consolidated_reports WHERE pattern_code NOT IN (SELECT pattern_code FROM master_card);
*/
GO

-- ==========================================
-- 1. MIGRATE trial_cards TABLE
-- ==========================================

-- 1.1 Add the new master_card_id column
IF NOT EXISTS (
    SELECT *
    FROM sys.columns
    WHERE object_id = OBJECT_ID('trial_cards')
      AND name = 'master_card_id'
)
BEGIN
    ALTER TABLE trial_cards
    ADD master_card_id INT;
END
GO

-- 1.2 Populate master_card_id from existing pattern_code links
UPDATE t
SET t.master_card_id = m.id
FROM trial_cards t
JOIN master_card m
    ON t.pattern_code = m.pattern_code;
GO

-- 1.3 Drop old constraints and columns dynamically
DECLARE @constraint_name NVARCHAR(255);

-- Find the constraint name linking pattern_code
SELECT @constraint_name = name
FROM sys.foreign_keys
WHERE parent_object_id = OBJECT_ID('trial_cards')
  AND referenced_object_id = OBJECT_ID('master_card');

-- Drop the constraint if it exists
IF @constraint_name IS NOT NULL
BEGIN
    EXEC ('ALTER TABLE trial_cards DROP CONSTRAINT ' + @constraint_name);
END
GO

DROP INDEX IF EXISTS idx_trial_pattern_code ON trial_cards;

ALTER TABLE trial_cards DROP COLUMN IF EXISTS part_name;
ALTER TABLE trial_cards DROP COLUMN IF EXISTS pattern_code;
GO

-- 1.4 Add new Foreign Key and Index
ALTER TABLE trial_cards
ALTER COLUMN master_card_id INT NOT NULL;

ALTER TABLE trial_cards
ADD CONSTRAINT FK_trial_cards_master
FOREIGN KEY (master_card_id)
REFERENCES master_card(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

CREATE INDEX idx_trial_master_card
ON trial_cards(master_card_id);
GO


-- ==========================================
-- 2. MIGRATE documents TABLE
-- ==========================================

-- 2.1 Add the new master_card_id column
IF NOT EXISTS (
    SELECT *
    FROM sys.columns
    WHERE object_id = OBJECT_ID('documents')
      AND name = 'master_card_id'
)
BEGIN
    ALTER TABLE documents
    ADD master_card_id INT;
END
GO

-- 2.2 Populate master_card_id
UPDATE d
SET d.master_card_id = m.id
FROM documents d
JOIN master_card m
    ON d.pattern_code = m.pattern_code;
GO

-- 2.3 Drop old constraints, indexes, and columns
DECLARE @constraint_name NVARCHAR(255);

-- Drop FK from documents (pattern_code)
SELECT @constraint_name = name
FROM sys.foreign_keys
WHERE parent_object_id = OBJECT_ID('documents')
  AND referenced_object_id = OBJECT_ID('master_card');

IF @constraint_name IS NOT NULL
BEGIN
    EXEC ('ALTER TABLE documents DROP CONSTRAINT ' + @constraint_name);
END
GO

ALTER TABLE documents DROP CONSTRAINT IF EXISTS FK_documents_master;
DROP INDEX IF EXISTS idx_documents_pattern ON documents;
ALTER TABLE documents DROP COLUMN IF EXISTS pattern_code;
GO

-- 2.4 Add new Foreign Key and Index
ALTER TABLE documents
ADD CONSTRAINT FK_documents_master
FOREIGN KEY (master_card_id)
REFERENCES master_card(id);

CREATE INDEX idx_documents_master
ON documents(master_card_id);
GO


-- ==========================================
-- 3. MIGRATE consolidated_reports TABLE
-- ==========================================

-- 3.1 Add the new master_card_id column
IF NOT EXISTS (
    SELECT *
    FROM sys.columns
    WHERE object_id = OBJECT_ID('consolidated_reports')
      AND name = 'master_card_id'
)
BEGIN
    ALTER TABLE consolidated_reports
    ADD master_card_id INT;
END
GO

-- 3.2 Populate master_card_id
UPDATE cr
SET cr.master_card_id = m.id
FROM consolidated_reports cr
JOIN master_card m
    ON cr.pattern_code = m.pattern_code;
GO

-- 3.3 Drop old constraints, indexes, and columns
DECLARE @constraint_name NVARCHAR(255);

-- Drop FK from consolidated_reports (pattern_code)
SELECT @constraint_name = name
FROM sys.foreign_keys
WHERE parent_object_id = OBJECT_ID('consolidated_reports')
  AND referenced_object_id = OBJECT_ID('master_card');

IF @constraint_name IS NOT NULL
BEGIN
    EXEC ('ALTER TABLE consolidated_reports DROP CONSTRAINT ' + @constraint_name);
END
GO

ALTER TABLE consolidated_reports DROP CONSTRAINT IF EXISTS uq_consolidated_reports_pattern;
DROP INDEX IF EXISTS idx_consolidated_reports_pattern ON consolidated_reports;
ALTER TABLE consolidated_reports DROP COLUMN IF EXISTS pattern_code;
GO

-- 3.4 Add new Unique Constraint, Foreign Key, and Index
ALTER TABLE consolidated_reports
ALTER COLUMN master_card_id INT NOT NULL;

ALTER TABLE consolidated_reports
ADD CONSTRAINT uq_consolidated_reports_master
UNIQUE (master_card_id);

ALTER TABLE consolidated_reports
ADD CONSTRAINT FK_consolidated_reports_master
FOREIGN KEY (master_card_id)
REFERENCES master_card(id)
ON DELETE CASCADE 
ON UPDATE CASCADE;

CREATE INDEX idx_consolidated_reports_master
ON consolidated_reports(master_card_id);
GO

PRINT 'Database successfully normalized.';