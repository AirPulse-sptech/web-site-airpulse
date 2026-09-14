CREATE DATABASE airpulse;
USE airpulse;

CREATE TABLE endereco (
    id_endereco INT PRIMARY KEY AUTO_INCREMENT,
    cep CHAR(8) NOT NULL,
    logradouro VARCHAR(100) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    complemento VARCHAR(100),
    estado CHAR(2) NOT NULL,
    cidade VARCHAR(100) NOT NULL
);

-- fabricante dos computadores:
CREATE TABLE empresa_fabricante (
    id_empresa_fabricante INT PRIMARY KEY AUTO_INCREMENT,
    razao_social VARCHAR(100) NOT NULL,
    nome_fantasia VARCHAR(100),
    cnpj CHAR(14) UNIQUE NOT NULL,
    segmento_atuacao VARCHAR(80) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    status_sistema TINYINT NOT NULL, -- se a empresa está ativa no nosso sistema
    entrada_sistema DATETIME NOT NULL, -- quando foi cadastrada
    website VARCHAR(200),
    fk_endereco INT,
    FOREIGN KEY (fk_endereco) REFERENCES endereco(id_endereco)
);

CREATE TABLE funcionario (
    id_funcionario INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    data_nascimento DATE,
    email_corporativo VARCHAR(200) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    cpf CHAR(11) NOT NULL,
    cargo VARCHAR(50),
    adm TINYINT NOT NULL, -- ADM ou comum
    senha VARCHAR(200) NOT NULL,
    status_sistema TINYINT NOT NULL DEFAULT 1,
    entrada_sistema DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fk_empresa_fabricante INT,
    FOREIGN KEY (fk_empresa_fabricante) REFERENCES empresa_fabricante(id_empresa_fabricante)
);



CREATE TABLE aeronave (
    id_aeronave INT PRIMARY KEY AUTO_INCREMENT,
    prefixo VARCHAR(10) UNIQUE NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    fabricante_aeronave VARCHAR(100) NOT NULL,
    numero_serie VARCHAR(45) UNIQUE NOT NULL,
    status_aeronave VARCHAR(45) NOT NULL, -- se está ativa, em manutenção ou inativa
    entrada_sistema DATETIME NOT NULL,
    companhia_aerea VARCHAR(100)
);

CREATE TABLE computador (
    id_computador INT PRIMARY KEY AUTO_INCREMENT,
    numero_serie VARCHAR(45) UNIQUE NOT NULL, 
    modelo VARCHAR(100) NOT NULL,
    status_computador VARCHAR(45) NOT NULL, -- ATIVO, MANUTENCAO, INATIVO
    data_instalacao DATE NOT NULL, -- instalação no avião
    entrada_sistema DATETIME NOT NULL,
    fk_aeronave INT,
    fk_empresa_fabricante INT,
    FOREIGN KEY (fk_aeronave) REFERENCES aeronave(id_aeronave),
    FOREIGN KEY (fk_empresa_fabricante) REFERENCES empresa_fabricante(id_empresa_fabricante)
);

CREATE TABLE componente (
    id_componente INT PRIMARY KEY AUTO_INCREMENT,
    tipo VARCHAR(45) NOT NULL, -- cpu, ram, disco
    modelo VARCHAR(100),
    numero_serie VARCHAR(100), 
    capacidade_total DECIMAL(14,2),
    unidade_capacidade VARCHAR(45),
    status_monitoramento TINYINT,
    entrada_sistema DATETIME,
    fk_computador INT,
    FOREIGN KEY (fk_computador) REFERENCES computador(id_computador)
);

CREATE TABLE parametro_monitoramento (
    id_parametro_monitoramento INT PRIMARY KEY AUTO_INCREMENT,
    limite_atencao DECIMAL(14,2) NOT NULL,
    limite_critico DECIMAL(14,2) NOT NULL,
	fk_computador INT,
    FOREIGN KEY (fk_computador) REFERENCES computador(id_computador)
);

-- O que será monitorado em relação a qual componente
CREATE TABLE metrica (
    id_metrica INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100),
    unidade_medida VARCHAR(45),
    descricao VARCHAR(200),
    fk_componente INT,
    fk_parametro_monitoramento INT,
    FOREIGN KEY (fk_componente) REFERENCES componente(id_componente),
    FOREIGN KEY (fk_parametro_monitoramento) REFERENCES parametro_monitoramento(id_parametro_monitoramento)
);


-- TESTE COM DADOS:

INSERT INTO endereco
    (cep, logradouro, bairro, numero, complemento, estado, cidade)
VALUES
    ('04571010', 'Avenida das Nacoes Unidas', 'Itaim Bibi', '12901', 'Andar 18', 'SP', 'Sao Paulo'),
    ('04094050', 'Avenida Republica do Libano', 'Moema', '251', 'Conjunto 81', 'SP', 'Sao Paulo'),
    ('12243000', 'Avenida Cassiano Ricardo', 'Jardim Aquarius', '601', 'Torre B', 'SP', 'Sao Jose dos Campos');

INSERT INTO empresa_fabricante
    (razao_social, nome_fantasia, cnpj, segmento_atuacao, email, telefone,
     status_sistema, entrada_sistema, website, fk_endereco)
VALUES
    ('Honeywell Aerospace Sistemas Aeronauticos Ltda.', 'Honeywell Aerospace', '12345678000195',
     'Sistemas avionicos e computadores de voo', 'contato.honeywell@airpulse.test', '1130011001',
     1, NOW(), 'https://aerospace.honeywell.com', 1),
    ('Thales Avionics Sistemas Aeronauticos Ltda.', 'Thales Avionics', '98765432000198',
     'Tecnologia aeroespacial e sistemas avionicos', 'contato.thales@airpulse.test', '1130011002',
     1, NOW(), 'https://www.thalesgroup.com', 2),
    ('Collins Aerospace Sistemas do Brasil Ltda.', 'Collins Aerospace', '45678912000155',
     'Sistemas embarcados e aviacao comercial', 'contato.collins@airpulse.test', '1230011003',
     1, NOW(), 'https://www.collinsaerospace.com', 3);

INSERT INTO funcionario
    (nome, data_nascimento, email_corporativo, telefone, cpf, cargo, adm,
     senha, status_sistema, entrada_sistema, fk_empresa_fabricante)
VALUES
    ('Guilherme Barbosa de Albuquerque', '2005-05-10', 'guilherme@honeywell.airpulse.test',
     '11970001001', '12345678909', 'Administrador de monitoramento', 1,
     'senha_teste_123', 1, NOW(), 1),
    ('Marina Oliveira', '1992-08-20', 'marina@honeywell.airpulse.test',
     '11970001002', '11144477735', 'Engenheira de sistemas avionicos', 0,
     'senha_teste_123', 1, NOW(), 1),
    ('Manuella Martins Arantes', '2004-11-18', 'manuella@thales.airpulse.test',
     '11970001003', '98765432100', 'Administradora de suporte', 1,
     'senha_teste_123', 1, NOW(), 2),
    ('Lucas Ferreira', '1994-02-14', 'lucas@thales.airpulse.test',
     '11970001004', '45678912364', 'Analista de manutencao preditiva', 0,
     'senha_teste_123', 1, NOW(), 2),
    ('Beatriz Santos', '1991-07-03', 'beatriz@collins.airpulse.test',
     '12970001005', '32165498791', 'Administradora de operacoes', 1,
     'senha_teste_123', 1, NOW(), 3),
    ('Rafael Costa', '1989-12-09', 'rafael@collins.airpulse.test',
     '12970001006', '74185296355', 'Tecnico de sistemas embarcados', 0,
     'senha_teste_123', 1, NOW(), 3);

INSERT INTO aeronave
    (prefixo, modelo, fabricante_aeronave, numero_serie, status_aeronave,
     entrada_sistema, companhia_aerea)
VALUES
    ('PR-APL', 'Boeing 737-8', 'Boeing', 'AP-B738-001', 'ATIVO', NOW(), 'GOL Linhas Aereas'),
    ('PT-APM', 'Airbus A320neo', 'Airbus', 'AP-A320-002', 'ATIVO', NOW(), 'LATAM Airlines Brasil'),
    ('PR-APN', 'Embraer E195-E2', 'Embraer', 'AP-E195-003', 'ATIVO', NOW(), 'Azul Linhas Aereas'),
    ('PR-APO', 'Boeing 737-800', 'Boeing', 'AP-B738-004', 'MANUTENCAO', NOW(), 'GOL Linhas Aereas'),
    ('PT-APP', 'Airbus A321neo', 'Airbus', 'AP-A321-005', 'ATIVO', NOW(), 'LATAM Airlines Brasil'),
    ('PR-APQ', 'Embraer E190-E2', 'Embraer', 'AP-E190-006', 'INATIVO', NOW(), 'Azul Linhas Aereas');

INSERT INTO computador
    (numero_serie, modelo, status_computador, data_instalacao, entrada_sistema,
     fk_aeronave, fk_empresa_fabricante)
VALUES
    ('FMC-HW-0001', 'Pegasus FMC v1', 'ATIVO', '2024-01-15', NOW(), 1, 1),
    ('FMC-TH-0002', 'TopFlight FMC v2', 'ATIVO', '2024-02-20', NOW(), 2, 2),
    ('FMC-CL-0003', 'Pro Line FMC v1', 'ATIVO', '2024-03-10', NOW(), 3, 3),
    ('FMC-HW-0004', 'Pegasus FMC v1', 'MANUTENCAO', '2023-09-18', NOW(), 4, 1),
    ('FMC-TH-0005', 'TopFlight FMC v2', 'ATIVO', '2024-05-05', NOW(), 5, 2),
    ('FMC-CL-0006', 'Pro Line FMC v1', 'INATIVO', '2023-06-12', NOW(), 6, 3);

INSERT INTO componente
    (tipo, modelo, numero_serie, capacidade_total, unidade_capacidade,
     status_monitoramento, entrada_sistema, fk_computador)
VALUES
    ('CPU', 'Processador embarcado HW-A1', 'CPU-HW-0001', 3.20, 'GHz', 1, NOW(), 1),
    ('RAM', 'Memoria ECC HW-A1', 'RAM-HW-0001', 16.00, 'GB', 1, NOW(), 1),
    ('ARMAZENAMENTO', 'SSD industrial HW-A1', 'SSD-HW-0001', 256.00, 'GB', 1, NOW(), 1),

    ('CPU', 'Processador embarcado TH-A2', 'CPU-TH-0002', 3.00, 'GHz', 1, NOW(), 2),
    ('RAM', 'Memoria ECC TH-A2', 'RAM-TH-0002', 32.00, 'GB', 1, NOW(), 2),
    ('ARMAZENAMENTO', 'SSD industrial TH-A2', 'SSD-TH-0002', 512.00, 'GB', 1, NOW(), 2),

    ('CPU', 'Processador embarcado CL-A3', 'CPU-CL-0003', 2.80, 'GHz', 1, NOW(), 3),
    ('RAM', 'Memoria ECC CL-A3', 'RAM-CL-0003', 16.00, 'GB', 1, NOW(), 3),
    ('ARMAZENAMENTO', 'SSD industrial CL-A3', 'SSD-CL-0003', 256.00, 'GB', 1, NOW(), 3),

    ('CPU', 'Processador embarcado HW-A1', 'CPU-HW-0004', 3.20, 'GHz', 1, NOW(), 4),
    ('RAM', 'Memoria ECC HW-A1', 'RAM-HW-0004', 16.00, 'GB', 1, NOW(), 4),
    ('ARMAZENAMENTO', 'SSD industrial HW-A1', 'SSD-HW-0004', 256.00, 'GB', 1, NOW(), 4),

    ('CPU', 'Processador embarcado TH-A2', 'CPU-TH-0005', 3.00, 'GHz', 1, NOW(), 5),
    ('RAM', 'Memoria ECC TH-A2', 'RAM-TH-0005', 32.00, 'GB', 1, NOW(), 5),
    ('ARMAZENAMENTO', 'SSD industrial TH-A2', 'SSD-TH-0005', 512.00, 'GB', 1, NOW(), 5),

    ('CPU', 'Processador embarcado CL-A3', 'CPU-CL-0006', 2.80, 'GHz', 0, NOW(), 6),
    ('RAM', 'Memoria ECC CL-A3', 'RAM-CL-0006', 16.00, 'GB', 0, NOW(), 6),
    ('ARMAZENAMENTO', 'SSD industrial CL-A3', 'SSD-CL-0006', 256.00, 'GB', 0, NOW(), 6);

INSERT INTO parametro_monitoramento
    (limite_atencao, limite_critico, fk_computador)
VALUES
    (75.00, 90.00, 1),
    (75.00, 90.00, 2),
    (70.00, 85.00, 3),
    (65.00, 80.00, 4),
    (75.00, 90.00, 5),
    (70.00, 85.00, 6);

INSERT INTO metrica
    (nome, unidade_medida, descricao, fk_componente, fk_parametro_monitoramento)
VALUES
    ('Uso de CPU', '%', 'Percentual de utilizacao do processador do FMC', 1, 1),
    ('Uso de memoria RAM', '%', 'Percentual de memoria RAM utilizada pelo FMC', 2, 1),
    ('Uso de armazenamento', '%', 'Percentual de armazenamento utilizado pelo FMC', 3, 1),

    ('Uso de CPU', '%', 'Percentual de utilizacao do processador do FMC', 4, 2),
    ('Uso de memoria RAM', '%', 'Percentual de memoria RAM utilizada pelo FMC', 5, 2),
    ('Uso de armazenamento', '%', 'Percentual de armazenamento utilizado pelo FMC', 6, 2),

    ('Uso de CPU', '%', 'Percentual de utilizacao do processador do FMC', 7, 3),
    ('Uso de memoria RAM', '%', 'Percentual de memoria RAM utilizada pelo FMC', 8, 3),
    ('Uso de armazenamento', '%', 'Percentual de armazenamento utilizado pelo FMC', 9, 3),

    ('Uso de CPU', '%', 'Percentual de utilizacao do processador do FMC', 10, 4),
    ('Uso de memoria RAM', '%', 'Percentual de memoria RAM utilizada pelo FMC', 11, 4),
    ('Uso de armazenamento', '%', 'Percentual de armazenamento utilizado pelo FMC', 12, 4),

    ('Uso de CPU', '%', 'Percentual de utilizacao do processador do FMC', 13, 5),
    ('Uso de memoria RAM', '%', 'Percentual de memoria RAM utilizada pelo FMC', 14, 5),
    ('Uso de armazenamento', '%', 'Percentual de armazenamento utilizado pelo FMC', 15, 5),

    ('Uso de CPU', '%', 'Percentual de utilizacao do processador do FMC', 16, 6),
    ('Uso de memoria RAM', '%', 'Percentual de memoria RAM utilizada pelo FMC', 17, 6),
    ('Uso de armazenamento', '%', 'Percentual de armazenamento utilizado pelo FMC', 18, 6);


SELECT 
    a.companhia_aerea AS 'Companhia',
    a.prefixo AS 'Prefixo Aeronave',
    emp.nome_fantasia AS 'Fabricante do FMC',
    comp.numero_serie AS 'Serial do Computador',
    c.tipo AS 'Componente',
    m.nome AS 'Métrica',
    pm.limite_critico AS 'Limite Crítico'
FROM metrica m
INNER JOIN componente c ON m.fk_componente = c.id_componente
INNER JOIN parametro_monitoramento pm ON m.fk_parametro_monitoramento = pm.id_parametro_monitoramento
INNER JOIN computador comp ON c.fk_computador = comp.id_computador
INNER JOIN aeronave a ON comp.fk_aeronave = a.id_aeronave
INNER JOIN empresa_fabricante emp ON comp.fk_empresa_fabricante = emp.id_empresa_fabricante;