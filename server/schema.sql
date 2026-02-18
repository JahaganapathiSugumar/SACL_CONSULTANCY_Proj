CREATE TABLE departments (
    department_id INT IDENTITY(1,1) PRIMARY KEY,
    department_name VARCHAR(50) UNIQUE NOT NULL
);
GO

CREATE TABLE dtc_users (
    user_id BIGINT NOT NULL IDENTITY(1,1),
    username VARCHAR(50) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    department_id INT DEFAULT NULL,
    role VARCHAR(20) NOT NULL,
    machine_shop_user_type VARCHAR(50) DEFAULT 'N/A',
    is_active BIT DEFAULT 1,
    needs_password_change BIT DEFAULT 1,
    email_verified BIT DEFAULT 0,
    created_at DATETIME2 NULL DEFAULT GETDATE(),
    last_login DATETIME2 NULL DEFAULT NULL,
    remarks NVARCHAR(MAX),
    profile_photo NVARCHAR(MAX),
    PRIMARY KEY (user_id),
    CONSTRAINT ux_username UNIQUE (username),
    CONSTRAINT dtc_users_chk_1 CHECK (role IN ('User','HOD','Admin')),
    CONSTRAINT dtc_users_chk_2 CHECK (machine_shop_user_type IN ('N/A','NPD','REGULAR')),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);
GO

CREATE INDEX idx_dtc_users_department ON dtc_users(department_id);
CREATE INDEX idx_dtc_users_role ON dtc_users(role);
CREATE INDEX idx_dtc_users_active ON dtc_users(is_active);
GO

CREATE TABLE master_card (
    id INT NOT NULL IDENTITY(1,1),
    pattern_code VARCHAR(150) NOT NULL,
    part_name VARCHAR(200) NOT NULL,
    material_grade VARCHAR(100),
    chemical_composition NVARCHAR(MAX),
    micro_structure NVARCHAR(MAX),
    tensile NVARCHAR(MAX),
    yield NVARCHAR(MAX),
    elongation NVARCHAR(MAX),
    impact_cold NVARCHAR(MAX),
    impact_room NVARCHAR(MAX),
    hardness_surface NVARCHAR(MAX),
    hardness_core NVARCHAR(MAX),
    xray NVARCHAR(MAX),
    mpi NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    is_active BIT DEFAULT 1,
    PRIMARY KEY (id),
    CONSTRAINT ux_pattern_code UNIQUE (pattern_code)
);
GO

CREATE TABLE trial_cards (
    trial_id INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
    part_name VARCHAR(100) NOT NULL,
    pattern_code VARCHAR(150) NOT NULL,
    trial_no INT NOT NULL,
    material_grade VARCHAR(50) NOT NULL,
    trial_type VARCHAR(50) NOT NULL DEFAULT 'INHOUSE MACHINING(NPD)',  
    initiated_by VARCHAR(50) NOT NULL,
    date_of_sampling DATE NOT NULL,
    plan_moulds INT CHECK (plan_moulds >= 0),
    actual_moulds INT CHECK (actual_moulds >= 0),
    reason_for_sampling NVARCHAR(MAX),
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED',
    tooling_modification NVARCHAR(MAX),
    remarks NVARCHAR(MAX),
    current_department_id INT,
    disa VARCHAR(50),
    sample_traceability VARCHAR(50),
    mould_correction NVARCHAR(MAX),
    deleted_at DATETIME2,
    deleted_by VARCHAR(50),
    CONSTRAINT chk_trial_status CHECK (status IN ('CREATED', 'IN_PROGRESS', 'CLOSED')),
    CONSTRAINT chk_trial_type CHECK (trial_type IN ('INHOUSE MACHINING(NPD)', 'INHOUSE MACHINING(REGULAR)', 'MACHINING - CUSTOMER END')),
    FOREIGN KEY (current_department_id) REFERENCES departments(department_id),
    FOREIGN KEY (pattern_code) REFERENCES master_card(pattern_code)
);
GO

CREATE INDEX idx_trial_pattern_code ON trial_cards(pattern_code);
CREATE INDEX idx_trial_status ON trial_cards(status);
CREATE INDEX idx_trial_department ON trial_cards(current_department_id);
GO

CREATE TABLE material_correction (
    trial_id INT PRIMARY KEY,
    chemical_composition NVARCHAR(MAX),
    process_parameters NVARCHAR(MAX),
    remarks NVARCHAR(MAX),
    date DATE,
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

CREATE TABLE pouring_details (
    trial_id INT PRIMARY KEY,
    pour_date DATE,
    heat_code NVARCHAR(MAX),
    composition NVARCHAR(MAX),
    no_of_mould_poured INT,
    pouring_temp_c DECIMAL(6,2) CHECK (pouring_temp_c > 0),
    pouring_time_sec INT CHECK (pouring_time_sec > 0),
    inoculation NVARCHAR(MAX),
    other_remarks NVARCHAR(MAX),
    remarks NVARCHAR(MAX),
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

CREATE TABLE sand_properties (
    trial_id INT PRIMARY KEY,
    date DATE,
    t_clay DECIMAL(7,2) CHECK (t_clay >= 0),
    a_clay DECIMAL(7,2) CHECK (a_clay >= 0),
    vcm DECIMAL(7,2) CHECK (vcm >= 0),
    loi DECIMAL(7,2) CHECK (loi >= 0),
    afs DECIMAL(7,2) CHECK (afs >= 0),
    gcs DECIMAL(7,2) CHECK (gcs >= 0),
    moi DECIMAL(7,2) CHECK (moi >= 0),
    compactability DECIMAL(7,2) CHECK (compactability >= 0),
    permeability DECIMAL(7,2) CHECK (permeability >= 0),
    remarks NVARCHAR(MAX),
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

CREATE TABLE mould_correction (
    trial_id INT PRIMARY KEY,
    mould_thickness VARCHAR(30),
    compressability VARCHAR(30),
    squeeze_pressure VARCHAR(30),
    mould_hardness VARCHAR(30),
    remarks NVARCHAR(MAX),
    date DATE,
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

CREATE TABLE metallurgical_inspection (
    trial_id INT PRIMARY KEY,
    inspection_date DATE,
    micro_structure NVARCHAR(MAX),
    micro_structure_ok BIT,
    micro_structure_remarks NVARCHAR(MAX),
    mech_properties NVARCHAR(MAX),
    mech_properties_ok BIT,
    mech_properties_remarks NVARCHAR(MAX),
    impact_strength NVARCHAR(MAX),
    impact_strength_ok BIT,
    impact_strength_remarks NVARCHAR(MAX),
    hardness NVARCHAR(MAX),
    hardness_ok BIT,
    hardness_remarks NVARCHAR(MAX),
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

CREATE TABLE visual_inspection (
    trial_id INT PRIMARY KEY,
    inspection_date DATE,
    inspections NVARCHAR(MAX),
    visual_ok BIT,
    remarks NVARCHAR(MAX),
    ndt_inspection NVARCHAR(MAX),
    ndt_inspection_ok BIT,
    ndt_inspection_remarks NVARCHAR(MAX),
    hardness NVARCHAR(MAX),
    hardness_ok BIT,
    hardness_remarks NVARCHAR(MAX),
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

CREATE TABLE dimensional_inspection (
    trial_id INT PRIMARY KEY,
    inspection_date DATE,
    casting_weight INT CHECK (casting_weight > 0),
    bunch_weight INT CHECK (bunch_weight > 0),
    no_of_cavities INT CHECK (no_of_cavities > 0),
    yields INT CHECK (yields >= 0),
    inspections NVARCHAR(MAX),
    remarks NVARCHAR(MAX),
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

CREATE TABLE machine_shop (
    trial_id INT PRIMARY KEY,
    inspection_date DATE,
    inspections NVARCHAR(MAX),
    remarks NVARCHAR(MAX),
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

CREATE TABLE department_progress (
    progress_id INT IDENTITY(1,1) PRIMARY KEY,
    trial_id INT NOT NULL,
    department_id INT NOT NULL,
    username VARCHAR(50) NOT NULL,
    completed_at DATETIME2 DEFAULT GETDATE(),
    approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    remarks NVARCHAR(MAX),
    CONSTRAINT chk_approval_status CHECK (approval_status IN ('pending', 'approved')),
    CONSTRAINT uq_trial_department UNIQUE (trial_id, department_id),
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    FOREIGN KEY (username) REFERENCES dtc_users(username)
);
GO

CREATE INDEX idx_dept_progress_trial ON department_progress(trial_id, department_id);
CREATE INDEX idx_dept_progress_status ON department_progress(approval_status);
GO

CREATE TABLE documents (
    document_id INT IDENTITY(1,1) PRIMARY KEY,
    trial_id INT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_base64 NVARCHAR(MAX),
    uploaded_by BIGINT,
    uploaded_at DATETIME2 DEFAULT GETDATE(),
    remarks NVARCHAR(MAX),
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES dtc_users(user_id)
);
GO

CREATE INDEX idx_documents_trial ON documents(trial_id);
CREATE INDEX idx_documents_type ON documents(document_type);
GO

CREATE TABLE email_otps (
    otp_id BIGINT NOT NULL IDENTITY(1,1),
    user_id BIGINT DEFAULT NULL,
    email NVARCHAR(255) NOT NULL,
    otp_code NVARCHAR(10) NOT NULL,
    attempts TINYINT NOT NULL DEFAULT 0,
    used BIT NOT NULL DEFAULT 0,
    expires_at DATETIME2 NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (otp_id),
    CONSTRAINT chk_otp_attempts CHECK (attempts >= 0 AND attempts <= 10),
    CONSTRAINT fk_emailotps_user FOREIGN KEY (user_id) REFERENCES dtc_users (user_id) ON DELETE CASCADE
);
GO

CREATE INDEX idx_user_email ON email_otps(user_id, email);
CREATE INDEX idx_email ON email_otps(email);
CREATE INDEX idx_expires_at ON email_otps(expires_at);
GO

CREATE TABLE audit_log (
    audit_id BIGINT NOT NULL IDENTITY(1,1),
    user_id INT DEFAULT NULL,
    trial_id INT DEFAULT NULL,
    department_id INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    action_timestamp DATETIME2 NULL DEFAULT GETDATE(),
    remarks NVARCHAR(MAX),
    PRIMARY KEY (audit_id)
);
GO

CREATE INDEX idx_audit_trial ON audit_log(trial_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_timestamp ON audit_log(action_timestamp);
CREATE INDEX idx_audit_trial_timestamp ON audit_log(trial_id, action_timestamp);
GO

CREATE TABLE tooling_pattern_data (
    id INT NOT NULL IDENTITY(1,1),
    master_card_id INT NOT NULL,
    number_of_cavity VARCHAR(50),  
    cavity_identification VARCHAR(50),
    pattern_material VARCHAR(50),
    core_weight VARCHAR(50),
    core_mask_thickness VARCHAR(50),
    estimated_casting_weight VARCHAR(50),
    estimated_bunch_weight VARCHAR(50),
    pattern_plate_thickness_sp VARCHAR(50),
    pattern_plate_weight_sp VARCHAR(50),
    core_mask_weight_sp VARCHAR(50),    
    crush_pin_height_sp VARCHAR(50),
    pattern_plate_thickness_pp VARCHAR(50),
    pattern_plate_weight_pp VARCHAR(50),
    crush_pin_height_pp VARCHAR(50),
    yield_label VARCHAR(50),
    remarks NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    PRIMARY KEY (id),
    CONSTRAINT fk_tooling_master
    FOREIGN KEY (master_card_id) REFERENCES master_card(id) 
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
GO

CREATE TABLE trial_reports (
    document_id INT IDENTITY(1,1) PRIMARY KEY,
    trial_id INT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_base64 NVARCHAR(MAX),
    uploaded_at DATETIME2 DEFAULT GETDATE(),
    deleted_at DATETIME2,
    deleted_by VARCHAR(50),
    remarks NVARCHAR(MAX),
    CONSTRAINT uq_trial_reports_trial UNIQUE (trial_id),
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

CREATE INDEX idx_trial_reports_trial ON trial_reports(trial_id);
CREATE INDEX idx_trial_reports_type ON trial_reports(document_type);
GO

CREATE TABLE consolidated_reports (
    document_id INT IDENTITY(1,1) PRIMARY KEY,
    pattern_code NVARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_base64 NVARCHAR(MAX),
    uploaded_at DATETIME2 DEFAULT GETDATE(),
    remarks NVARCHAR(MAX),
    CONSTRAINT uq_consolidated_reports_pattern UNIQUE (pattern_code),
);
GO

CREATE INDEX idx_consolidated_reports_pattern ON consolidated_reports(pattern_code);
CREATE INDEX idx_consolidated_reports_type ON consolidated_reports(document_type);
GO

CREATE TABLE department_flow (
    id INT PRIMARY KEY IDENTITY,
    department_id INT,
    sequence_no INT,
    CONSTRAINT uq_department_flow_sequence UNIQUE(sequence_no),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);
GO
