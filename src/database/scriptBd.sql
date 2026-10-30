CREATE DATABASE airpulse;
USE airpulse;

CREATE TABLE endereco (
idEndereco INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
cep CHAR(8),
logradouro VARCHAR(100),
bairro VARCHAR(100),
numero VARCHAR(20),
complemento VARCHAR(100),
estado CHAR(2),
cidade VARCHAR(100)
);

CREATE TABLE empresaFabricante (
idEmpresaFabricante  INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
razaoSocial VARCHAR(100),
nomeFantasia VARCHAR(100),
cnpj CHAR(14),
segmentoAtuacao VARCHAR(80),
telefone VARCHAR(20) NOT NULL,
statusSistema VARCHAR(80) NOT NULL,
entradaSistema DATETIME NOT NULL,
fkEndereco INT,
CONSTRAINT ctEmpresaFabricanteStatus CHECK (statusSistema IN ('ATIVO', 'INATIVO')),
CONSTRAINT ctEmpresaFabricanteEndereco
FOREIGN KEY (fkEndereco) REFERENCES endereco (idEndereco)
);

CREATE TABLE funcionario (
idFuncionario INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
nome VARCHAR(100),
dataNascimento DATE,
emailCorporativo VARCHAR(100),
telefone VARCHAR(20),
cpf CHAR(11),
cargo VARCHAR(8) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
senha VARCHAR(200),
statusSistema VARCHAR(80) NOT NULL,
entradaSistema DATETIME,
fkEmpresaFabricante INT NOT NULL,
CONSTRAINT ctFuncionarioCargo CHECK (CAST(cargo AS BINARY) IN ('ADMIN', 'GESTOR', 'ANALISTA')),
CONSTRAINT ctFuncionarioEmpresaFabricante
FOREIGN KEY (fkEmpresaFabricante) REFERENCES empresaFabricante (idEmpresaFabricante)
);

CREATE TABLE aeronave (
idAeronave INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
nome VARCHAR(100),
modelo VARCHAR(100),
numeroSerie VARCHAR(45),
statusAeronave VARCHAR(45),
entradaSistema DATETIME,
companhiaAerea VARCHAR(100),
fkEmpresaFabricante INT NOT NULL,
CONSTRAINT ctAeronaveEmpresaFabricante
FOREIGN KEY (fkEmpresaFabricante) REFERENCES empresaFabricante (idEmpresaFabricante)
);

CREATE TABLE funcionarioAeronave (
fkFuncionario INT NOT NULL,
fkAeronave INT NOT NULL,
dataVinculo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (fkFuncionario, fkAeronave),
CONSTRAINT ctFuncionarioAeronaveFuncionario
FOREIGN KEY (fkFuncionario) REFERENCES funcionario (idFuncionario),
CONSTRAINT ctFuncionarioAeronaveAeronave
FOREIGN KEY (fkAeronave) REFERENCES aeronave (idAeronave)
);

CREATE TABLE computador (
idComputador INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
nome VARCHAR(45),
tipoFmc VARCHAR(45),
hostname VARCHAR(255) NOT NULL,
modelo VARCHAR(100) NOT NULL,
statusComputador VARCHAR(45) NOT NULL,
dataInstalacao DATE NOT NULL,
entradaSistema DATE NOT NULL,
fkAeronave INT NOT NULL,
CONSTRAINT ctComputadorAeronave
FOREIGN KEY (fkAeronave) REFERENCES aeronave (idAeronave)
);

CREATE TABLE placa (
idPlaca INT PRIMARY KEY UNIQUE NOT NULL AUTO_INCREMENT,
nome VARCHAR(100),
modelo VARCHAR(100),
numeroSerie VARCHAR(45),
fkComputador INT NOT NULL,
CONSTRAINT ctPlacaComputador
FOREIGN KEY (fkComputador) REFERENCES computador (idComputador)
);

CREATE TABLE componente (
idComponente INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
tipo VARCHAR(45),
modelo VARCHAR(100),
statusMonitoramento VARCHAR(45),
limiteAtencao DECIMAL(14,2),
limiteCritico DECIMAL(14,2),
fkPlaca INT NOT NULL,
CONSTRAINT ctComponentePlaca
FOREIGN KEY (fkPlaca) REFERENCES placa (idPlaca)
);

CREATE TABLE metrica (
idMetrica INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
nome VARCHAR(45),
unidadeMedida VARCHAR(45),
descricao VARCHAR(200),
fkComponente INT NOT NULL,
CONSTRAINT fkMetricaComponente1
FOREIGN KEY (fkComponente) REFERENCES componente (idComponente)
);

CREATE TABLE leitura (
idLeitura INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
valor DECIMAL(14,2) NOT NULL,
dataHora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
fkMetrica INT NOT NULL,
CONSTRAINT fkLeituraMetrica
FOREIGN KEY (fkMetrica) REFERENCES metrica (idMetrica)
);

CREATE TABLE alerta (
idAlerta INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
nivel VARCHAR(10) NOT NULL,
valor DECIMAL(14,2) NOT NULL,
dataHora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
fkLeitura INT NOT NULL,
CONSTRAINT ctAlertaNivel CHECK (nivel IN ('ATENCAO', 'CRITICO')),
CONSTRAINT fkAlertaLeitura
FOREIGN KEY (fkLeitura) REFERENCES leitura (idLeitura)
);

CREATE TABLE relatorio (
idRelatorio INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
titulo VARCHAR(150) NOT NULL,
periodoInicio DATE NOT NULL,
periodoFim DATE NOT NULL,
texto MEDIUMTEXT NOT NULL,
statusRelatorio VARCHAR(45) NOT NULL DEFAULT 'RASCUNHO',
criticidade VARCHAR(45),
categoria VARCHAR(20) NOT NULL,
dataCriacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
fkAeronave INT NOT NULL,
CONSTRAINT ctRelatorioStatus CHECK (statusRelatorio IN ('RASCUNHO', 'EM_REVISAO', 'PUBLICADO')),
CONSTRAINT ctRelatorioCriticidade CHECK (criticidade IN ('NORMAL', 'ATENCAO', 'CRITICO')),
CONSTRAINT ctRelatorioCategoria CHECK (categoria IN ('DESEMPENHO', 'FALHA_HARDWARE', 'ARMAZENAMENTO', 'MEMORIA_RAM', 'PROCESSADOR', 'PERDA_CONEXAO')),
CONSTRAINT ctRelatorioPeriodo CHECK (periodoFim >= periodoInicio),
CONSTRAINT fkRelatorioAeronave
FOREIGN KEY (fkAeronave) REFERENCES aeronave (idAeronave),
INDEX idxRelatorioStatusCategoria (statusRelatorio, categoria)
);

CREATE TABLE funcionarioRelatorio (
idFuncionarioRelatorio INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
dataVinculo DATE NOT NULL,
papel VARCHAR(10) NOT NULL DEFAULT 'COAUTOR',
fkFuncionario INT NOT NULL,
CONSTRAINT fkFuncionarioRelatorio1
FOREIGN KEY (fkFuncionario) REFERENCES funcionario (idFuncionario),
fkRelatorio INT NOT NULL,
CONSTRAINT fkFuncionarioRelatorio2
FOREIGN KEY (fkRelatorio) REFERENCES relatorio (idRelatorio),
CONSTRAINT ctFuncionarioRelatorioPapel CHECK (papel IN ('AUTOR', 'COAUTOR')),
CONSTRAINT ctFuncionarioRelatorioUnico UNIQUE (fkFuncionario, fkRelatorio)
);

INSERT INTO endereco (cep, logradouro, bairro, numero, complemento, estado, cidade)
VALUES ('04571010', 'Avenida das Nações Unidas', 'Itaim Bibi', '1000', 'Sala 10', 'SP', 'São Paulo');

INSERT INTO empresaFabricante (
    razaoSocial, nomeFantasia, cnpj, segmentoAtuacao, telefone,
    statusSistema, entradaSistema, fkEndereco
) VALUES (
    'AeroNova Sistemas Ltda.', 'AeroNova', '12345678000195', 'Sistemas aeronáuticos',
    '1130001000', 'ATIVO', NOW(), 1
);

INSERT INTO funcionario (
    nome, dataNascimento, emailCorporativo, telefone, cpf, cargo, senha,
    statusSistema, entradaSistema, fkEmpresaFabricante
) VALUES (
    'Vírginia', '1992-08-20', 'virginia@gmail.com', '11970001002', '11144477735',
    'GESTOR', 'urubu100', '1', NOW(), 1
);

INSERT INTO funcionario (
    nome, dataNascimento, emailCorporativo, telefone, cpf, cargo, senha,
    statusSistema, entradaSistema, fkEmpresaFabricante
) VALUES (
    'Otavio', '1994-02-14', 'otavio@gmail.com', '11970001001', '98765432100',
    'ANALISTA', 'urubu100', '1', NOW(), 1
);

INSERT INTO funcionario (
    nome, dataNascimento, emailCorporativo, telefone, cpf, cargo, senha,
    statusSistema, entradaSistema, fkEmpresaFabricante
) VALUES
    ('Mariana', '1995-03-12', 'mariana@gmail.com', '11970001003', '52998224725',
        'ANALISTA', 'urubu100', '1', NOW(), 1),
    ('Lucas', '1993-06-25', 'lucas@gmail.com', '11970001004', '16899535009',
        'ANALISTA', 'urubu100', '1', NOW(), 1),
    ('Beatriz', '1996-11-08', 'beatriz@gmail.com', '11970001005', '12345678909',
        'ANALISTA', 'urubu100', '1', NOW(), 1),
    ('Rafael', '1991-09-17', 'rafael@gmail.com', '11970001006', '39053344705',
        'ANALISTA', 'urubu100', '1', NOW(), 1),
    ('Camila', '1997-04-30', 'camila@gmail.com', '11970001007', '86288366757',
        'ANALISTA', 'urubu100', '1', NOW(), 1);

INSERT INTO funcionario (
    nome, dataNascimento, emailCorporativo, telefone, cpf, cargo, senha,
    statusSistema, entradaSistema, fkEmpresaFabricante
) VALUES (
    'AirPulse', '1990-01-01', 'airpulse@gmail.com', '11999999999', '00000000000',
    'ADMIN', 'urubu100', '1', NOW(), 1
);

INSERT INTO aeronave (
    nome, modelo, numeroSerie, statusAeronave, entradaSistema, companhiaAerea, fkEmpresaFabricante
) VALUES ('PR-AER', 'Boeing 737-8', 'AN-001', 'ATIVA',
    DATE_SUB(NOW(), INTERVAL 90 DAY), 'GOL', 1);

INSERT INTO aeronave (
    nome, modelo, numeroSerie, statusAeronave, entradaSistema, companhiaAerea, fkEmpresaFabricante
) VALUES ('PR-ANV', 'Airbus A320neo', 'AN-002', 'ATIVA',
    DATE_SUB(NOW(), INTERVAL 90 DAY), 'LATAM', 1);

INSERT INTO aeronave (
    nome, modelo, numeroSerie, statusAeronave, entradaSistema, companhiaAerea, fkEmpresaFabricante
) VALUES ('PR-MNT', 'Embraer E195-E2', 'AN-003', 'MANUTENCAO',
    DATE_SUB(NOW(), INTERVAL 90 DAY), 'Azul', 1);

INSERT INTO aeronave (
    nome, modelo, numeroSerie, statusAeronave, entradaSistema, companhiaAerea, fkEmpresaFabricante
) VALUES ('PR-RES', 'Boeing 737-800', 'AN-004', 'INATIVA',
    DATE_SUB(NOW(), INTERVAL 90 DAY), 'GOL', 1);

INSERT INTO funcionarioAeronave (fkFuncionario, fkAeronave, dataVinculo)
VALUES
    (2, 1, DATE_SUB(NOW(), INTERVAL 60 DAY)),
    (2, 2, DATE_SUB(NOW(), INTERVAL 45 DAY)),
    (2, 3, DATE_SUB(NOW(), INTERVAL 30 DAY)),
    (3, 1, DATE_SUB(NOW(), INTERVAL 60 DAY)),
    (3, 3, DATE_SUB(NOW(), INTERVAL 45 DAY)),
    (4, 2, DATE_SUB(NOW(), INTERVAL 60 DAY)),
    (4, 3, DATE_SUB(NOW(), INTERVAL 45 DAY)),
    (5, 1, DATE_SUB(NOW(), INTERVAL 60 DAY)),
    (5, 2, DATE_SUB(NOW(), INTERVAL 45 DAY)),
    (5, 3, DATE_SUB(NOW(), INTERVAL 30 DAY)),
    (6, 1, DATE_SUB(NOW(), INTERVAL 60 DAY)),
    (6, 2, DATE_SUB(NOW(), INTERVAL 45 DAY)),
    (7, 3, DATE_SUB(NOW(), INTERVAL 30 DAY));

INSERT INTO computador (
    nome, tipoFmc, hostname, modelo, statusComputador, dataInstalacao, entradaSistema, fkAeronave
) VALUES
    ('FMC PR-AER MESTRE', 'MESTRE', 'pr-aer-mestre', 'FMC-3000', 'ATIVO',
        DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(CURDATE(), INTERVAL 90 DAY), 1),
    ('FMC PR-AER SPARE', 'SPARE', 'pr-aer-spare', 'FMC-3000', 'ATIVO',
        DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(CURDATE(), INTERVAL 90 DAY), 1),
    ('FMC PR-ANV MESTRE', 'MESTRE', 'pr-anv-mestre', 'FMC-3000', 'ATIVO',
        DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(CURDATE(), INTERVAL 90 DAY), 2),
    ('FMC PR-ANV SPARE', 'SPARE', 'pr-anv-spare', 'FMC-3000', 'ATIVO',
        DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(CURDATE(), INTERVAL 90 DAY), 2),
    ('FMC PR-MNT MESTRE', 'MESTRE', 'pr-mnt-mestre', 'FMC-3000', 'MANUTENCAO',
        DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(CURDATE(), INTERVAL 90 DAY), 3),
    ('FMC PR-MNT SPARE', 'SPARE', 'pr-mnt-spare', 'FMC-3000', 'ATIVO',
        DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(CURDATE(), INTERVAL 90 DAY), 3),
    ('FMC PR-RES MESTRE', 'MESTRE', 'pr-res-mestre', 'FMC-3000', 'INATIVO',
        DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(CURDATE(), INTERVAL 90 DAY), 4),
    ('FMC PR-RES SPARE', 'SPARE', 'pr-res-spare', 'FMC-3000', 'INATIVO',
        DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(CURDATE(), INTERVAL 90 DAY), 4);

INSERT INTO placa (nome, modelo, numeroSerie, fkComputador)
VALUES
    ('Placa principal FMC PR-AER MESTRE', 'AP-BOARD-3000', 'PL-1', 1),
    ('Placa principal FMC PR-AER SPARE', 'AP-BOARD-3000', 'PL-2', 2),
    ('Placa principal FMC PR-ANV MESTRE', 'AP-BOARD-3000', 'PL-3', 3),
    ('Placa principal FMC PR-ANV SPARE', 'AP-BOARD-3000', 'PL-4', 4),
    ('Placa principal FMC PR-MNT MESTRE', 'AP-BOARD-3000', 'PL-5', 5),
    ('Placa principal FMC PR-MNT SPARE', 'AP-BOARD-3000', 'PL-6', 6),
    ('Placa principal FMC PR-RES MESTRE', 'AP-BOARD-3000', 'PL-7', 7),
    ('Placa principal FMC PR-RES SPARE', 'AP-BOARD-3000', 'PL-8', 8);

INSERT INTO componente (tipo, modelo, statusMonitoramento, limiteAtencao, limiteCritico, fkPlaca)
VALUES
    ('CPU', 'Processador embarcado quad-core', 'ATIVO', 75.00, 90.00, 1),
    ('RAM', 'Memória DDR4 16 GB', 'ATIVO', 80.00, 95.00, 1),
    ('DISCO', 'SSD industrial 256 GB', 'ATIVO', 80.00, 90.00, 1),
    ('CPU', 'Processador embarcado quad-core', 'ATIVO', 75.00, 90.00, 2),
    ('RAM', 'Memória DDR4 16 GB', 'ATIVO', 80.00, 95.00, 2),
    ('DISCO', 'SSD industrial 256 GB', 'ATIVO', 80.00, 90.00, 2),
    ('CPU', 'Processador embarcado quad-core', 'ATIVO', 75.00, 90.00, 3),
    ('RAM', 'Memória DDR4 16 GB', 'ATIVO', 80.00, 95.00, 3),
    ('DISCO', 'SSD industrial 256 GB', 'ATIVO', 80.00, 90.00, 3),
    ('CPU', 'Processador embarcado quad-core', 'ATIVO', 75.00, 90.00, 4),
    ('RAM', 'Memória DDR4 16 GB', 'ATIVO', 80.00, 95.00, 4),
    ('DISCO', 'SSD industrial 256 GB', 'ATIVO', 80.00, 90.00, 4),
    ('CPU', 'Processador embarcado quad-core', 'ATIVO', 75.00, 90.00, 5),
    ('RAM', 'Memória DDR4 16 GB', 'ATIVO', 80.00, 95.00, 5),
    ('DISCO', 'SSD industrial 256 GB', 'ATIVO', 80.00, 90.00, 5),
    ('CPU', 'Processador embarcado quad-core', 'ATIVO', 75.00, 90.00, 6),
    ('RAM', 'Memória DDR4 16 GB', 'ATIVO', 80.00, 95.00, 6),
    ('DISCO', 'SSD industrial 256 GB', 'ATIVO', 80.00, 90.00, 6),
    ('CPU', 'Processador embarcado quad-core', 'INATIVO', 75.00, 90.00, 7),
    ('RAM', 'Memória DDR4 16 GB', 'INATIVO', 80.00, 95.00, 7),
    ('DISCO', 'SSD industrial 256 GB', 'INATIVO', 80.00, 90.00, 7),
    ('CPU', 'Processador embarcado quad-core', 'INATIVO', 75.00, 90.00, 8),
    ('RAM', 'Memória DDR4 16 GB', 'INATIVO', 80.00, 95.00, 8),
    ('DISCO', 'SSD industrial 256 GB', 'INATIVO', 80.00, 90.00, 8);

INSERT INTO metrica (nome, unidadeMedida, descricao, fkComponente)
VALUES
    ('Uso de CPU', '%', 'Percentual de utilização do componente do FMC.', 1),
    ('Uso de memória RAM', '%', 'Percentual de utilização do componente do FMC.', 2),
    ('Uso de armazenamento', '%', 'Percentual de utilização do componente do FMC.', 3),
    ('Uso de CPU', '%', 'Percentual de utilização do componente do FMC.', 4),
    ('Uso de memória RAM', '%', 'Percentual de utilização do componente do FMC.', 5),
    ('Uso de armazenamento', '%', 'Percentual de utilização do componente do FMC.', 6),
    ('Uso de CPU', '%', 'Percentual de utilização do componente do FMC.', 7),
    ('Uso de memória RAM', '%', 'Percentual de utilização do componente do FMC.', 8),
    ('Uso de armazenamento', '%', 'Percentual de utilização do componente do FMC.', 9),
    ('Uso de CPU', '%', 'Percentual de utilização do componente do FMC.', 10),
    ('Uso de memória RAM', '%', 'Percentual de utilização do componente do FMC.', 11),
    ('Uso de armazenamento', '%', 'Percentual de utilização do componente do FMC.', 12),
    ('Uso de CPU', '%', 'Percentual de utilização do componente do FMC.', 13),
    ('Uso de memória RAM', '%', 'Percentual de utilização do componente do FMC.', 14),
    ('Uso de armazenamento', '%', 'Percentual de utilização do componente do FMC.', 15),
    ('Uso de CPU', '%', 'Percentual de utilização do componente do FMC.', 16),
    ('Uso de memória RAM', '%', 'Percentual de utilização do componente do FMC.', 17),
    ('Uso de armazenamento', '%', 'Percentual de utilização do componente do FMC.', 18),
    ('Uso de CPU', '%', 'Percentual de utilização do componente do FMC.', 19),
    ('Uso de memória RAM', '%', 'Percentual de utilização do componente do FMC.', 20),
    ('Uso de armazenamento', '%', 'Percentual de utilização do componente do FMC.', 21),
    ('Uso de CPU', '%', 'Percentual de utilização do componente do FMC.', 22),
    ('Uso de memória RAM', '%', 'Percentual de utilização do componente do FMC.', 23),
    ('Uso de armazenamento', '%', 'Percentual de utilização do componente do FMC.', 24);

INSERT INTO relatorio (
    titulo, periodoInicio, periodoFim, texto, statusRelatorio,
    criticidade, categoria, dataCriacao, fkAeronave
) VALUES
    ('Desempenho inicial dos sistemas de bordo', DATE_SUB(CURDATE(), INTERVAL 35 DAY),
        DATE_SUB(CURDATE(), INTERVAL 29 DAY), 'Desempenho estável durante os voos monitorados.',
        'PUBLICADO', 'NORMAL', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 29 DAY), '00:00:00'), 1),
    ('Inspeção do módulo de controle', DATE_SUB(CURDATE(), INTERVAL 33 DAY),
        DATE_SUB(CURDATE(), INTERVAL 27 DAY), 'Falha intermitente no módulo de controle exige inspeção.',
        'PUBLICADO', 'CRITICO', 'FALHA_HARDWARE',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 27 DAY), '00:00:00'), 2),
    ('Capacidade de armazenamento do FMC', DATE_SUB(CURDATE(), INTERVAL 31 DAY),
        DATE_SUB(CURDATE(), INTERVAL 25 DAY), 'Armazenamento próximo ao limite de atenção; programar limpeza.',
        'PUBLICADO', 'ATENCAO', 'ARMAZENAMENTO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 25 DAY), '00:00:00'), 1),
    ('Uso elevado de memória RAM', DATE_SUB(CURDATE(), INTERVAL 29 DAY),
        DATE_SUB(CURDATE(), INTERVAL 23 DAY), 'Uso de RAM excedeu o limite crítico durante o diagnóstico.',
        'PUBLICADO', 'CRITICO', 'MEMORIA_RAM',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 23 DAY), '00:00:00'), 3),
    ('Picos de processamento em voo', DATE_SUB(CURDATE(), INTERVAL 27 DAY),
        DATE_SUB(CURDATE(), INTERVAL 21 DAY), 'Picos de CPU acima do limite de atenção, sem interrupção da operação.',
        'PUBLICADO', 'ATENCAO', 'PROCESSADOR',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 21 DAY), '00:00:00'), 2),
    ('Interrupção de conexão do FMC reserva', DATE_SUB(CURDATE(), INTERVAL 25 DAY),
        DATE_SUB(CURDATE(), INTERVAL 19 DAY), 'Perda de comunicação registrada; revisar os conectores.',
        'PUBLICADO', 'CRITICO', 'PERDA_CONEXAO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 19 DAY), '00:00:00'), 1),
    ('Revisão de desempenho operacional', DATE_SUB(CURDATE(), INTERVAL 23 DAY),
        DATE_SUB(CURDATE(), INTERVAL 17 DAY), 'Indicadores dentro dos parâmetros após a revisão.',
        'PUBLICADO', 'NORMAL', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 17 DAY), '00:00:00'), 2),
    ('Diagnóstico da placa principal', DATE_SUB(CURDATE(), INTERVAL 21 DAY),
        DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'Substituição da placa recomendada após falhas recorrentes.',
        'PUBLICADO', 'CRITICO', 'FALHA_HARDWARE',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 15 DAY), '00:00:00'), 3),
    ('Armazenamento após limpeza', DATE_SUB(CURDATE(), INTERVAL 19 DAY),
        DATE_SUB(CURDATE(), INTERVAL 13 DAY), 'Espaço em disco normalizado após a remoção de registros antigos.',
        'PUBLICADO', 'NORMAL', 'ARMAZENAMENTO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 13 DAY), '00:00:00'), 1),
    ('Acompanhamento da memória RAM', DATE_SUB(CURDATE(), INTERVAL 17 DAY),
        DATE_SUB(CURDATE(), INTERVAL 11 DAY), 'Consumo de RAM em atenção durante o período de maior carga.',
        'PUBLICADO', 'ATENCAO', 'MEMORIA_RAM',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 11 DAY), '00:00:00'), 2),
    ('Revisão do desempenho do processador', DATE_SUB(CURDATE(), INTERVAL 15 DAY),
        DATE_SUB(CURDATE(), INTERVAL 9 DAY), 'Processador estável após o ajuste das tarefas de coleta.',
        'PUBLICADO', 'NORMAL', 'PROCESSADOR',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 9 DAY), '00:00:00'), 1),
    ('Restabelecimento da conexão de bordo', DATE_SUB(CURDATE(), INTERVAL 13 DAY),
        DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'Comunicação restabelecida na bancada de manutenção.',
        'PUBLICADO', 'NORMAL', 'PERDA_CONEXAO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 7 DAY), '00:00:00'), 3),
    ('Análise de desempenho da semana', DATE_SUB(CURDATE(), INTERVAL 11 DAY),
        DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Desempenho em atenção devido à oscilação de tempo de resposta.',
        'EM_REVISAO', 'ATENCAO', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 5 DAY), '00:00:00'), 1),
    ('Revisão do módulo de hardware', DATE_SUB(CURDATE(), INTERVAL 10 DAY),
        DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'Validar a inspeção preventiva antes de publicar o parecer.',
        'EM_REVISAO', 'ATENCAO', 'FALHA_HARDWARE',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '00:00:00'), 2),
    ('Planejamento de limpeza do armazenamento', DATE_SUB(CURDATE(), INTERVAL 9 DAY),
        DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Levantamento inicial para liberação de espaço no FMC.',
        'RASCUNHO', 'ATENCAO', 'ARMAZENAMENTO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '00:00:00'), 3),
    ('Investigação do consumo de RAM', DATE_SUB(CURDATE(), INTERVAL 8 DAY),
        DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Análise inicial dos picos de memória no FMC mestre.',
        'RASCUNHO', 'CRITICO', 'MEMORIA_RAM',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '00:00:00'), 1),
    ('Desempenho recente da frota', DATE_SUB(CURDATE(), INTERVAL 7 DAY),
        DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Desempenho normal nos últimos voos monitorados.',
        'PUBLICADO', 'NORMAL', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '00:00:00'), 2),
    ('Verificação diária dos sistemas', DATE_SUB(CURDATE(), INTERVAL 6 DAY),
        DATE_SUB(CURDATE(), INTERVAL 0 DAY), 'Verificação diária concluída com desempenho normal.',
        'PUBLICADO', 'NORMAL', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 0 DAY), '00:00:00'), 1);

INSERT INTO funcionarioRelatorio (dataVinculo, papel, fkFuncionario, fkRelatorio)
VALUES
    (DATE_SUB(CURDATE(), INTERVAL 29 DAY), 'AUTOR', 2, 1),
    (DATE_SUB(CURDATE(), INTERVAL 27 DAY), 'AUTOR', 4, 2),
    (DATE_SUB(CURDATE(), INTERVAL 25 DAY), 'AUTOR', 3, 3),
    (DATE_SUB(CURDATE(), INTERVAL 23 DAY), 'AUTOR', 5, 4),
    (DATE_SUB(CURDATE(), INTERVAL 21 DAY), 'AUTOR', 6, 5),
    (DATE_SUB(CURDATE(), INTERVAL 19 DAY), 'AUTOR', 3, 6),
    (DATE_SUB(CURDATE(), INTERVAL 17 DAY), 'AUTOR', 2, 7),
    (DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'AUTOR', 4, 8),
    (DATE_SUB(CURDATE(), INTERVAL 13 DAY), 'AUTOR', 3, 9),
    (DATE_SUB(CURDATE(), INTERVAL 11 DAY), 'AUTOR', 5, 10),
    (DATE_SUB(CURDATE(), INTERVAL 9 DAY), 'AUTOR', 6, 11),
    (DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'AUTOR', 7, 12),
    (DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'AUTOR', 2, 13),
    (DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'AUTOR', 4, 14),
    (DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'AUTOR', 3, 15),
    (DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'AUTOR', 5, 16),
    (DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'AUTOR', 2, 17),
    (DATE_SUB(CURDATE(), INTERVAL 0 DAY), 'AUTOR', 2, 18);
