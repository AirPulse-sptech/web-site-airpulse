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
statusAnalise VARCHAR(15) NOT NULL DEFAULT 'PENDENTE',
dataProcessamentoAnalise DATETIME,
erroAnalise VARCHAR(255),
statusRelatorio VARCHAR(45) NOT NULL DEFAULT 'RASCUNHO',
criticidade VARCHAR(45),
categoria VARCHAR(20) NOT NULL,
dataCriacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
fkAeronave INT NOT NULL,
CONSTRAINT ctRelatorioStatus CHECK (statusRelatorio IN ('RASCUNHO', 'EM_REVISAO', 'PUBLICADO')),
CONSTRAINT ctRelatorioCriticidade CHECK (criticidade IN ('NORMAL', 'ATENCAO', 'CRITICO')),
CONSTRAINT ctRelatorioCategoria CHECK (categoria IN ('DESEMPENHO', 'FALHA_HARDWARE', 'ARMAZENAMENTO', 'MEMORIA_RAM', 'PROCESSADOR', 'PERDA_CONEXAO')),
CONSTRAINT ctRelatorioPeriodo CHECK (periodoFim >= periodoInicio),
CONSTRAINT ctRelatorioAnalise CHECK (statusAnalise IN ('PENDENTE', 'PROCESSANDO', 'CONCLUIDO', 'ERRO')),
CONSTRAINT fkRelatorioAeronave
FOREIGN KEY (fkAeronave) REFERENCES aeronave (idAeronave),
INDEX idxRelatorioStatusCategoria (statusRelatorio, categoria)
);

CREATE TABLE analiseRelatorio (
idAnalise INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
fkRelatorio INT NOT NULL,
componente VARCHAR(60) NOT NULL,
sintoma VARCHAR(150) NOT NULL,
situacao VARCHAR(20) NOT NULL,
recomendacao TEXT,
trechoEvidencia TEXT NOT NULL,
dataAnalise DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT ctAnaliseSituacao CHECK (situacao IN ('IDENTIFICADO', 'SUSPEITO', 'CORRIGIDO', 'NAO_INFORMADO')),
CONSTRAINT fkAnaliseRelatorio FOREIGN KEY (fkRelatorio) REFERENCES relatorio (idRelatorio) ON DELETE CASCADE,
INDEX idxAnaliseRelatorio (fkRelatorio)
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

CREATE TABLE relatorioAlerta (
fkRelatorio INT NOT NULL,
alertaIdAws VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
dadosAlerta JSON NOT NULL,
dataVinculo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (fkRelatorio, alertaIdAws),
CONSTRAINT fkRelatorioAlertaRelatorio
FOREIGN KEY (fkRelatorio) REFERENCES relatorio (idRelatorio) ON DELETE CASCADE
);

INSERT INTO endereco (cep, logradouro, bairro, numero, complemento, estado, cidade)
VALUES ('04571010', 'Avenida das Nações Unidas', 'Itaim Bibi', '1000', 'Sala 10', 'SP', 'São Paulo');

INSERT INTO empresaFabricante (
    razaoSocial, nomeFantasia, cnpj, segmentoAtuacao, telefone,
    statusSistema, entradaSistema, fkEndereco
) VALUES (
    'AeroNova Sistemas Ltda.', 'AeroNova', '12345678000195', 'Fabricante de computadores de bordo',
    '1130001000', 'ATIVO', NOW(), 1
);

INSERT INTO funcionario (
    nome, dataNascimento, emailCorporativo, telefone, cpf, cargo, senha,
    statusSistema, entradaSistema, fkEmpresaFabricante
) VALUES (
    'Liziane', '1992-08-20', 'liziane@gmail.com', '11970001002', '11144477735',
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
        DATE_SUB(CURDATE(), INTERVAL 29 DAY), 'CONTEXTO: Cenário fictício da PR-AER, Boeing 737-8, com acompanhamento dos FMCs pr-aer-mestre e pr-aer-spare em 12 ciclos de teste durante o período informado.
EVIDÊNCIAS: No mestre, CPU média de 43% e máxima de 68%, RAM média de 56% e máxima de 72%, armazenamento entre 62% e 66%. No spare, máximas de CPU de 61% e RAM de 69%. Limites de atenção/crítico: CPU 75%/90%, RAM 80%/95% e armazenamento 80%/90%.
RESULTADO: Não foram identificados reinícios, perda de conexão ou estouro dos limites. O tempo de resposta observado variou entre 180 e 240 ms. A cobertura compreende somente os ciclos de teste, sem conclusão sobre períodos não acompanhados.
ACOMPANHAMENTO: Manter a coleta dos dois FMCs e comparar as próximas janelas com esta referência. Não houve ação corretiva, pois nenhum problema foi identificado.',
        'PUBLICADO', 'NORMAL', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 29 DAY), '00:00:00'), 1),
    ('Inspeção do módulo de controle', DATE_SUB(CURDATE(), INTERVAL 33 DAY),
        DATE_SUB(CURDATE(), INTERVAL 27 DAY), 'CONTEXTO: Cenário fictício da PR-ANV, Airbus A320neo. Foram acompanhados 10 ciclos de teste dos FMCs pr-anv-mestre e pr-anv-spare.
EVIDÊNCIAS: A placa principal PL-3 do FMC mestre apresentou três reinícios inesperados em dois ciclos distintos, com interrupções de processamento de 8, 11 e 14 segundos. O log local registrou reinício do controlador nos mesmos instantes. Antes dos eventos, CPU máxima de 67% e RAM máxima de 74%, abaixo dos limites de atenção de 75% e 80%.
SITUAÇÃO: Reinício inesperado do FMC mestre identificado e ainda não corrigido. Instabilidade na alimentação da placa é suspeita, sem medição elétrica que confirme a causa. O spare permaneceu acessível, sem reinícios nos ciclos observados; isso não comprova a integridade do mestre.
AÇÕES: Inspecionar a alimentação e os conectores da placa PL-3 em bancada antes de encerrar a ocorrência. Registrar tensão durante a reprodução da falha e repetir 10 ciclos após eventual reparo.
LIMITAÇÃO: A causa e a eficácia do reparo permanecem sem confirmação; a classificação crítica decorre das interrupções registradas.',
        'PUBLICADO', 'CRITICO', 'FALHA_HARDWARE',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 27 DAY), '00:00:00'), 2),
    ('Capacidade de armazenamento do FMC', DATE_SUB(CURDATE(), INTERVAL 31 DAY),
        DATE_SUB(CURDATE(), INTERVAL 25 DAY), 'CONTEXTO: Cenário fictício de capacidade do SSD de 256 GB do FMC pr-aer-mestre, PR-AER, durante sete dias de acompanhamento.
EVIDÊNCIAS: O uso de armazenamento aumentou de 76% para 86%, acima do limite de atenção de 80% e abaixo do crítico de 90%. Foram observados 220,16 GB ocupados e 35,84 GB livres no encerramento. Os registros de diagnóstico representavam 42 GB, dos quais 18 GB tinham retenção vencida. O spare terminou com 58% de ocupação.
SITUAÇÃO: Uso elevado de armazenamento identificado, sem limpeza executada neste período. Não foram observadas falhas de gravação. A associação do crescimento com os registros de diagnóstico é sustentada pelo inventário; não foi avaliada a evolução de outros diretórios.
AÇÕES: Validar a retenção com a equipe responsável e remover somente os registros vencidos após cópia verificada. Medir a ocupação ao final da limpeza e acompanhar o crescimento por sete dias.
IMPACTO: A redução de espaço livre exige planejamento de capacidade, sem evidência de indisponibilidade neste recorte.',
        'PUBLICADO', 'ATENCAO', 'ARMAZENAMENTO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 25 DAY), '00:00:00'), 1),
    ('Uso elevado de memória RAM', DATE_SUB(CURDATE(), INTERVAL 29 DAY),
        DATE_SUB(CURDATE(), INTERVAL 23 DAY), 'CONTEXTO: Cenário fictício da PR-MNT, Embraer E195-E2 em manutenção. Avaliação de oito ciclos de diagnóstico em bancada do FMC pr-mnt-mestre, equipado com 16 GB de RAM.
EVIDÊNCIAS: Uso elevado de memória identificado em cinco ciclos, com RAM máxima de 97%, equivalente a 15,52 GB, acima do limite crítico de 95%. A ocupação permaneceu acima de 95% por 18 minutos acumulados. Foram observadas duas interrupções do processo de diagnóstico por falta de memória. No spare, o máximo foi 71%.
HIPÓTESE: Vazamento de memória no processo de diagnóstico é suspeito, pois a ocupação cresceu de 62% para 97% ao longo de quatro repetições. Não há perfil de alocações que confirme essa causa; defeito físico de RAM também não foi demonstrado.
AÇÕES: Coletar o perfil de memória do processo em bancada e comparar o consumo após cada repetição. Repetir oito ciclos após a correção proposta, verificando ausência de interrupções e RAM abaixo de 80%.
SITUAÇÃO: Problema não corrigido até o encerramento. Reiniciar o processo reduziu temporariamente o uso para 64%, sem demonstrar solução definitiva.',
        'PUBLICADO', 'CRITICO', 'MEMORIA_RAM',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 23 DAY), '00:00:00'), 3),
    ('Picos de processamento em voo', DATE_SUB(CURDATE(), INTERVAL 27 DAY),
        DATE_SUB(CURDATE(), INTERVAL 21 DAY), 'CONTEXTO: Cenário fictício da PR-ANV, FMC pr-anv-mestre. Foram avaliados 14 ciclos simulando carga de voo, com comparação ao spare.
EVIDÊNCIAS: Uso elevado de CPU identificado em seis ciclos, com picos de 84% a 88% durante tarefas simultâneas de coleta e consolidação. O tempo acumulado acima de 75% foi de 22 minutos; nenhum pico atingiu o limite crítico de 90%. O tempo de resposta subiu de 210 ms para 460 ms durante os eventos. O spare atingiu no máximo 63% de CPU.
SITUAÇÃO: A coincidência entre tarefas e picos foi observada, mas a causa ainda não foi confirmada por perfil de execução. Não houve reinício nem interrupção de comunicação no recorte. Os reinícios descritos no relatório anterior da PR-ANV são outra ocorrência, sem evidência de relação causal com estes picos.
AÇÕES: Revisar o agendamento das tarefas de coleta e medir CPU e tempo de resposta em 14 ciclos equivalentes após o ajuste. Acompanhar também o mestre quanto aos reinícios ainda sob investigação.
CONCLUSÃO: Picos de CPU permanecem em atenção e não foram corrigidos neste período.',
        'PUBLICADO', 'ATENCAO', 'PROCESSADOR',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 21 DAY), '00:00:00'), 2),
    ('Interrupção de conexão do FMC reserva', DATE_SUB(CURDATE(), INTERVAL 25 DAY),
        DATE_SUB(CURDATE(), INTERVAL 19 DAY), 'CONTEXTO: Cenário fictício da PR-AER, FMC pr-aer-spare, com 16 horas de observação em bancada.
EVIDÊNCIAS: Perda de conexão identificada em quatro episódios de 45, 60, 90 e 105 segundos, totalizando cinco minutos sem comunicação com o coletor. O log local do spare manteve registros durante as lacunas; portanto, ausência de telemetria não foi interpretada como uso zero de CPU ou RAM. O mestre permaneceu acessível.
SITUAÇÃO: Mau contato no conector de comunicação é suspeito, pois uma desconexão ocorreu durante movimentação do chicote. Não foi realizado teste de continuidade que confirme a origem. Não há evidência de falha de CPU, RAM ou SSD no material disponível.
AÇÕES: Inspecionar os conectores e testar a continuidade do chicote em bancada. Após eventual intervenção, repetir 16 horas de observação e registrar a quantidade e a duração das desconexões.
CONCLUSÃO: Comunicação intermitente ainda não corrigida. A classificação crítica considera a repetição das perdas de observabilidade do FMC reserva, sem afirmar impacto sobre sistemas de voo.',
        'PUBLICADO', 'CRITICO', 'PERDA_CONEXAO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 19 DAY), '00:00:00'), 1),
    ('Revisão de desempenho operacional', DATE_SUB(CURDATE(), INTERVAL 23 DAY),
        DATE_SUB(CURDATE(), INTERVAL 17 DAY), 'CONTEXTO: Cenário fictício de acompanhamento da PR-ANV após revisão em bancada do FMC pr-anv-mestre. Foram repetidos 14 ciclos com carga equivalente à avaliação dos picos de CPU.
INTERVENÇÕES: O agendamento das tarefas de coleta foi escalonado. A equipe também reassentou o conector de alimentação da placa PL-3, mas não registrou medição elétrica anterior à intervenção.
EVIDÊNCIAS: Uso elevado de CPU corrigido no ensaio de validação: máximo de 69%, contra 88% no ensaio anterior, sem amostras acima de 75%. O tempo de resposta ficou entre 190 e 250 ms. Os reinícios inesperados do mestre não reapareceram nos 14 ciclos após o reassentamento do conector.
SITUAÇÃO: O sintoma de reinício foi corrigido no recorte de validação, mas a causa elétrica permanece suspeita pela ausência de medição. RAM máxima de 76%, sem interrupção por falta de memória. Os resultados não garantem ausência de recorrência fora do ensaio.
AÇÕES: Acompanhar CPU e reinícios por mais sete dias e preservar os logs de qualquer recorrência. Não foi observada nova falha nesta janela.',
        'PUBLICADO', 'NORMAL', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 17 DAY), '00:00:00'), 2),
    ('Diagnóstico da placa principal', DATE_SUB(CURDATE(), INTERVAL 21 DAY),
        DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'CONTEXTO: Cenário fictício da PR-MNT, em manutenção, com 12 ciclos em bancada do FMC pr-mnt-mestre e inspeção da placa principal PL-5.
EVIDÊNCIAS: Reinício inesperado do FMC mestre identificado em quatro ciclos, com interrupções entre 9 e 16 segundos. Dois eventos ocorreram com RAM entre 66% e 72%, mostrando que os reinícios não se restringem aos episódios de RAM crítica descritos no relatório anterior. O spare não reiniciou.
SITUAÇÃO: Defeito na placa PL-5 é suspeito; a recorrência dos reinícios não confirma qual circuito falhou. O uso elevado de memória permanece identificado em testes separados, com pico de 96%, e ainda não há validação da correção do processo de diagnóstico. Não foi comprovada relação causal entre os dois problemas.
AÇÕES: Encaminhar a placa PL-5 para diagnóstico elétrico e avaliar sua substituição conforme o resultado da bancada. Investigar o consumo de RAM separadamente e repetir os ciclos de diagnóstico após cada intervenção.
CONCLUSÃO: Nenhuma substituição foi executada neste período. Os reinícios e o uso elevado de memória continuam pendentes; o ensaio não autoriza conclusão sobre liberação da aeronave.',
        'PUBLICADO', 'CRITICO', 'FALHA_HARDWARE',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 15 DAY), '00:00:00'), 3),
    ('Armazenamento após limpeza', DATE_SUB(CURDATE(), INTERVAL 19 DAY),
        DATE_SUB(CURDATE(), INTERVAL 13 DAY), 'CONTEXTO: Cenário fictício de acompanhamento do SSD de 256 GB do FMC pr-aer-mestre, PR-AER, após o relatório de ocupação de 86%.
INTERVENÇÃO: Após validar a retenção e verificar a cópia, a equipe removeu 18 GB de registros vencidos. A ocupação caiu de 220,16 GB para 202,16 GB, equivalentes a 78,97% da capacidade, com 53,84 GB livres.
EVIDÊNCIAS: Uso elevado de armazenamento corrigido após a limpeza: as verificações seguintes ficaram entre 78,97% e 79,60%, abaixo do limite de atenção de 80%. Nenhuma falha de gravação foi observada durante os sete dias do recorte. O spare terminou com 59% de ocupação.
LIMITAÇÃO: A margem até o limite de atenção permanece pequena. A limpeza tratou a ocupação, mas não demonstrou redução da geração de registros. Não se estima prazo de esgotamento com esta amostra.
AÇÕES: Revisar a política de retenção e acompanhar diariamente o espaço livre por mais sete dias. Preservar os registros exigidos antes de qualquer nova remoção.',
        'PUBLICADO', 'NORMAL', 'ARMAZENAMENTO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 13 DAY), '00:00:00'), 1),
    ('Acompanhamento da memória RAM', DATE_SUB(CURDATE(), INTERVAL 17 DAY),
        DATE_SUB(CURDATE(), INTERVAL 11 DAY), 'CONTEXTO: Cenário fictício da PR-ANV, FMC pr-anv-mestre com 16 GB de RAM. Avaliação de 10 ciclos com coleta e geração simultânea de arquivos de diagnóstico.
EVIDÊNCIAS: Uso elevado de memória identificado em três ciclos, com ocupação entre 83% e 89%, acima da atenção de 80% e abaixo do crítico de 95%. O pico equivale a 14,24 GB. O tempo acima de 80% foi de 12 minutos acumulados; a ocupação retornou a 65% ao terminar a geração de arquivos. No spare, RAM máxima de 70%.
SITUAÇÃO: Sobrecarga temporária durante a geração de arquivos é suspeita como causa, sem perfil de memória que comprove a origem. Não foram observadas interrupções por falta de memória, reinícios ou recorrência dos picos de CPU corrigidos no acompanhamento anterior; CPU máxima de 71%.
AÇÕES: Medir o consumo por processo durante a geração de arquivos e comparar com ciclos sem essa tarefa. Reavaliar a concorrência das tarefas antes de propor aumento de capacidade.
CONCLUSÃO: RAM permanece em atenção, sem correção validada. Este caso compartilha o sintoma de uso elevado de memória com a PR-MNT, mas não confirma uma causa comum.',
        'PUBLICADO', 'ATENCAO', 'MEMORIA_RAM',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 11 DAY), '00:00:00'), 2),
    ('Revisão do desempenho do processador', DATE_SUB(CURDATE(), INTERVAL 15 DAY),
        DATE_SUB(CURDATE(), INTERVAL 9 DAY), 'CONTEXTO: Cenário fictício da PR-AER, FMC pr-aer-mestre. Nos dois primeiros dias do período, três de oito ciclos de bancada tiveram CPU entre 79% e 85% durante consolidação de registros.
INTERVENÇÃO: No terceiro dia, a equipe escalonou a consolidação para evitar sobreposição com a coleta. Foram realizados 12 ciclos equivalentes nos dias restantes.
EVIDÊNCIAS: Uso elevado de CPU corrigido nos 12 ciclos após o ajuste: máximo de 70%, abaixo da atenção de 75% e do crítico de 90%. O tempo de resposta máximo caiu de 430 ms para 260 ms. RAM máxima de 73%, sem reinícios ou perda de comunicação do mestre no recorte.
SITUAÇÃO: A correção do sintoma foi validada sob a carga ensaiada. Não foi feita comparação sob cargas superiores, nem demonstrada relação entre estes picos e a perda de conexão anteriormente registrada no spare.
AÇÕES: Manter o agendamento revisado e comparar os próximos 12 ciclos com esta validação. Reabrir a investigação se o uso de CPU voltar a ultrapassar 75%.',
        'PUBLICADO', 'NORMAL', 'PROCESSADOR',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 9 DAY), '00:00:00'), 1),
    ('Restabelecimento da conexão de bordo', DATE_SUB(CURDATE(), INTERVAL 13 DAY),
        DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'CONTEXTO: Cenário fictício da PR-MNT, em manutenção. O FMC pr-mnt-spare apresentou três perdas de conexão de 30, 50 e 70 segundos no início da janela de bancada.
EVIDÊNCIAS E INTERVENÇÃO: O teste de continuidade identificou interrupção no chicote de comunicação durante movimentação controlada. A equipe substituiu o chicote e repetiu o teste sem interrupção de continuidade.
RESULTADO: Perda de conexão do spare corrigida após a substituição do chicote. Durante 24 horas de observação após a intervenção, não houve nova desconexão. Os logs locais confirmaram que o FMC continuava processando durante as lacunas anteriores.
LIMITAÇÃO: A correção se refere apenas à conexão do spare. Os reinícios da placa PL-5 e o uso elevado de memória do mestre descritos em relatórios anteriores não foram reavaliados neste ensaio e não podem ser considerados corrigidos.
AÇÕES: Acompanhar a conexão do spare por mais 24 horas e manter as investigações da placa e da RAM do mestre em registros separados. Este resultado de bancada não altera a condição de manutenção da aeronave.',
        'PUBLICADO', 'NORMAL', 'PERDA_CONEXAO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 7 DAY), '00:00:00'), 3),
    ('Análise de desempenho da semana', DATE_SUB(CURDATE(), INTERVAL 11 DAY),
        DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'CONTEXTO: Cenário fictício da PR-AER, FMC pr-aer-mestre. Relatório em revisão sobre 10 ciclos após o ajuste das tarefas de coleta.
EVIDÊNCIAS: Tempo de resposta elevado identificado em dois ciclos: 620 e 680 ms, contra faixa de referência de 180 a 260 ms. Nos mesmos ciclos, CPU máxima de 72%, RAM máxima de 78% e armazenamento de 79,70%, abaixo dos respectivos limites de atenção. Não houve reinício observado.
HIPÓTESE: Espera por gravação durante a consolidação de arquivos é suspeita. Não foi coletada latência do SSD; os dados disponíveis não comprovam falha de armazenamento nem nova sobrecarga de CPU.
AÇÕES: Coletar latência de gravação e tempo de resposta com e sem consolidação de arquivos em 10 ciclos equivalentes. Revisar os resultados com o coavaliador antes da publicação.
PENDÊNCIA: A oscilação permanece sem correção e a cobertura de comunicação do spare não foi avaliada neste relatório. O parecer é preliminar e não encerra ocorrências anteriores.',
        'EM_REVISAO', 'ATENCAO', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 5 DAY), '00:00:00'), 1),
    ('Revisão do módulo de hardware', DATE_SUB(CURDATE(), INTERVAL 10 DAY),
        DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'CONTEXTO: Cenário fictício de inspeção preventiva da placa PL-3 do FMC pr-anv-mestre, PR-ANV. Documento em revisão após o acompanhamento sem reinícios da janela anterior.
EVIDÊNCIAS: A inspeção visual registrou uma marca escurecida próxima ao conector de alimentação. Em seis ciclos de bancada, não houve reinício; CPU máxima de 70% e RAM máxima de 77%. Não foram realizadas medições de temperatura ou tensão no ponto observado.
SITUAÇÃO: Aquecimento anormal do conector é suspeito, sem evidência suficiente para confirmar superaquecimento ou defeito da placa. A marca visual não comprova a causa dos reinícios históricos, cujo sintoma não reapareceu neste recorte.
AÇÕES: Medir temperatura e tensão do conector sob carga controlada e comparar com a especificação do fabricante antes de concluir o parecer. Anexar os resultados da medição à revisão.
PENDÊNCIA: A hipótese não foi confirmada nem corrigida. Não há recomendação de substituição definitiva sem o diagnóstico complementar.',
        'EM_REVISAO', 'ATENCAO', 'FALHA_HARDWARE',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '00:00:00'), 2),
    ('Planejamento de limpeza do armazenamento', DATE_SUB(CURDATE(), INTERVAL 9 DAY),
        DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'CONTEXTO: Cenário fictício da PR-MNT, FMC pr-mnt-mestre em bancada. Rascunho de planejamento de capacidade do SSD de 256 GB.
EVIDÊNCIAS: Uso elevado de armazenamento identificado: ocupação de 84%, equivalente a 215,04 GB, com 40,96 GB livres. O limite de atenção é 80% e o crítico é 90%. O inventário preliminar encontrou 12 GB de arquivos de diagnóstico cuja retenção ainda não foi validada. Não houve falha de gravação nos quatro ciclos observados.
PLANEJAMENTO: A remoção integral desses 12 GB reduziria a ocupação para aproximadamente 79,31%, mas essa projeção não é uma medição nem comprova correção. Nenhum arquivo foi removido.
AÇÕES: Validar a retenção dos arquivos e realizar cópia verificada antes de autorizar qualquer remoção. Medir novamente o espaço livre após a intervenção e observar o crescimento durante sete dias.
PENDÊNCIA: O uso elevado permanece identificado. A análise de capacidade não investiga nem encerra as ocorrências de placa e RAM do mesmo FMC.',
        'RASCUNHO', 'ATENCAO', 'ARMAZENAMENTO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '00:00:00'), 3),
    ('Investigação do consumo de RAM', DATE_SUB(CURDATE(), INTERVAL 8 DAY),
        DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'CONTEXTO: Cenário fictício da PR-AER, FMC pr-aer-mestre com 16 GB de RAM. Rascunho de investigação em cinco ciclos de diagnóstico com exportação de registros.
EVIDÊNCIAS: Uso elevado de memória identificado em dois ciclos, com pico de 96%, equivalente a 15,36 GB, acima do crítico de 95%. O processo de exportação foi interrompido uma vez por falta de memória. CPU máxima de 74%, sem reinício do FMC. O spare permaneceu abaixo de 73% de RAM.
HIPÓTESE: Retenção de buffers pelo processo de exportação é suspeita, pois a ocupação aumentou de 68% para 96% durante a tarefa. Não houve perfil de alocações nem teste físico da RAM, portanto não se confirma vazamento ou defeito do módulo.
AÇÕES: Coletar perfil de memória durante a exportação e repetir os cinco ciclos após o ajuste proposto. Verificar ausência de interrupção e RAM abaixo de 80% antes de encerrar a ocorrência.
PENDÊNCIA: Não houve correção validada. O sintoma também aparece em relatórios da PR-ANV e PR-MNT, mas os processos e as condições diferem; não se atribui causa comum sem investigação.',
        'RASCUNHO', 'CRITICO', 'MEMORIA_RAM',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '00:00:00'), 1),
    ('Desempenho recente dos FMCs da PR-ANV', DATE_SUB(CURDATE(), INTERVAL 7 DAY),
        DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'CONTEXTO: Cenário fictício da PR-ANV, com 18 ciclos de bancada dos FMCs pr-anv-mestre e pr-anv-spare.
INTERVENÇÃO: Antes dos ciclos de validação, a equipe limitou a geração simultânea de arquivos de diagnóstico no mestre para tratar o uso elevado de memória da janela anterior.
EVIDÊNCIAS: Uso elevado de memória corrigido nos 18 ciclos de validação: RAM máxima de 76%, contra 89% anteriormente, abaixo da atenção de 80%. CPU máxima de 71%, armazenamento de 65% e tempo de resposta entre 190 e 250 ms. Não foram observados reinícios nem perda de conexão nos dois FMCs.
LIMITAÇÃO: A suspeita de aquecimento do conector da placa PL-3 não foi investigada por medição térmica nesta janela. A ausência de reinícios não confirma nem descarta essa hipótese de hardware.
AÇÕES: Manter a limitação de concorrência e acompanhar a RAM por mais sete dias. Concluir a medição do conector registrada no parecer em revisão.',
        'PUBLICADO', 'NORMAL', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '00:00:00'), 2),
    ('Verificação diária dos sistemas', DATE_SUB(CURDATE(), INTERVAL 6 DAY),
        DATE_SUB(CURDATE(), INTERVAL 0 DAY), 'CONTEXTO: Cenário fictício de verificação da PR-AER em seis ciclos equivalentes de bancada dos FMCs pr-aer-mestre e pr-aer-spare, após as ocorrências registradas nas janelas anteriores.
INTERVENÇÕES: No mestre, a equipe corrigiu a liberação de buffers do processo de exportação e separou a consolidação da janela de coleta. No spare, substituiu o conector após teste de continuidade confirmar mau contato no chicote.
EVIDÊNCIAS: Uso elevado de memória do mestre corrigido nos seis ciclos após o ajuste, com RAM máxima de 77%, contra 96% antes, sem interrupção da exportação. Tempo de resposta elevado corrigido no mesmo ensaio, com máximo de 250 ms, contra 680 ms antes. Perda de conexão do spare corrigida após a troca do conector, sem desconexões em 16 horas de observação. CPU máxima de 70% e armazenamento do mestre de 79,80%, abaixo da atenção de 80%.
LIMITAÇÃO: A margem de armazenamento continua pequena e a amostra de seis ciclos não garante ausência de recorrência. Os resultados são de bancada, sem parecer de aeronavegabilidade.
AÇÕES: Acompanhar memória, tempo de resposta e comunicação por mais sete dias. Revisar a retenção de registros antes de a ocupação atingir novamente 80%.',
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
