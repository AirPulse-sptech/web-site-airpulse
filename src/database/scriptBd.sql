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
email VARCHAR(200),
telefone VARCHAR(20) NOT NULL,
statusSistema VARCHAR(80) NOT NULL,
entradaSistema DATETIME NOT NULL,
fkEndereco INT,
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

CREATE TABLE computador (
idComputador INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
nome VARCHAR(45),
tipoFmc VARCHAR(45),
numeroSerie VARCHAR(45) NOT NULL,
modelo VARCHAR(100) NOT NULL,
statusComputador VARCHAR(45) NOT NULL,
dataInstalacao DATE NOT NULL,
entradaSistema DATE NOT NULL,
fkAeronave INT NOT NULL,
CONSTRAINT ctComputadorAeronave
FOREIGN KEY (fkAeronave) REFERENCES aeronave (idAeronave)
);

CREATE TABLE placa (
idPlaca INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
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

CREATE TABLE scriptPython (
idScriptPython INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
texto TEXT
);

CREATE TABLE metrica (
idMetrica INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
nome VARCHAR(45),
unidadeMedida VARCHAR(45),
descricao VARCHAR(200),
fkComponente INT NOT NULL,
CONSTRAINT fkMetricaComponente1
FOREIGN KEY (fkComponente) REFERENCES componente (idComponente),
fkScriptPython INT NULL,
CONSTRAINT fkMetricaScriptPython
FOREIGN KEY (fkScriptPython) REFERENCES scriptPython (idScriptPython)
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
dataCriacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
fkAeronave INT NOT NULL,
CONSTRAINT ctRelatorioStatus CHECK (statusRelatorio IN ('RASCUNHO', 'EM_REVISAO', 'PUBLICADO')),
CONSTRAINT ctRelatorioCriticidade CHECK (criticidade IN ('NORMAL', 'ATENCAO', 'CRITICO')),
CONSTRAINT ctRelatorioPeriodo CHECK (periodoFim >= periodoInicio),
CONSTRAINT fkRelatorioAeronave
FOREIGN KEY (fkAeronave) REFERENCES aeronave (idAeronave)
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

INSERT INTO empresaFabricante (razaoSocial, nomeFantasia, cnpj, segmentoAtuacao, email, telefone, statusSistema, entradaSistema, fkEndereco)
VALUES ('AirPulse', 'AirPulse', '00000000000100', 'Gestão Interna', 'air.pulse@airpulse.com', '11999999999', 1, NOW(), NULL);

INSERT INTO funcionario (
    nome,
    dataNascimento,
    emailCorporativo,
    telefone,
    cpf,
    cargo,
    senha,
    statusSistema,
    entradaSistema,
    fkEmpresaFabricante
) VALUES (
    'Admin AirPulse',
    '1990-01-01',
    'air.pulse@airpulse.com',
    '11999999999',
    '00000000000',
    'ADMIN',
    'urubu100',
    1,
    NOW(),
    (SELECT idEmpresaFabricante FROM empresaFabricante WHERE cnpj = '00000000000100' LIMIT 1)
);

INSERT INTO endereco (cep, logradouro, bairro, numero, complemento, estado, cidade)
VALUES ('04571010', 'Avenida das Nacoes Unidas', 'Itaim Bibi', '1000', 'Sala 10', 'SP', 'Sao Paulo');

INSERT INTO empresaFabricante (
    razaoSocial, nomeFantasia, cnpj, segmentoAtuacao, email, telefone,
    statusSistema, entradaSistema, fkEndereco
) VALUES (
    'AeroNova Sistemas Ltda.', 'AeroNova', '12345678000195', 'Sistemas aeronauticos',
    'aeronova.airpulse.teste@gmail.com', '1130001000', 1, NOW(), LAST_INSERT_ID()
);

INSERT INTO funcionario (
    nome, dataNascimento, emailCorporativo, telefone, cpf, cargo, senha,
    statusSistema, entradaSistema, fkEmpresaFabricante
) VALUES (
    'Gabriel', '1994-02-14', 'gabriel@gmail.com',
    '11970001001', '98765432100', 'ANALISTA', 'urubu100', 1, NOW(),
    (SELECT idEmpresaFabricante FROM empresaFabricante WHERE cnpj = '12345678000195' LIMIT 1)
), (
    'Thays', '1992-08-20', 'thays@gmail.com',
    '11970001002', '11144477735', 'GESTOR', 'urubu100', 1, NOW(),
    (SELECT idEmpresaFabricante FROM empresaFabricante WHERE cnpj = '12345678000195' LIMIT 1)
);

INSERT INTO aeronave (
    nome, modelo, numeroSerie, statusAeronave, entradaSistema, companhiaAerea, fkEmpresaFabricante
    ) VALUES (
        'PR-AER', 'Boeing 737-8', 'AN-001', 'ATIVA', NOW(),
        'GOL', 2);
