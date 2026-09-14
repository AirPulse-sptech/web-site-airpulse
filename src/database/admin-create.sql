
USE airpulse;

INSERT INTO empresa_fabricante (razao_social, nome_fantasia, cnpj, segmento_atuacao, email, telefone, status_sistema, entrada_sistema, website, fk_endereco)
VALUES ('AirPulse', 'AirPulse', '00000000000100', 'Gestão Interna', 'air.pulse@airpulse.com', '11999999999', 1, NOW(), NULL, NULL);
SET @empresa_id = LAST_INSERT_ID();

INSERT INTO funcionario (
    nome,
    data_nascimento,
    email_corporativo,
    telefone,
    cpf,
    cargo,
    adm,
    senha,
    status_sistema,
    entrada_sistema,
    fk_empresa_fabricante
) VALUES (
    'Admin AirPulse',
    '1990-01-01',
    'air.pulse@airpulse.com',
    '11999999999',
    '00000000000',
    'ADMIN',
    1,               -- adm = 1 (true)
    'urubu100',
    1,
    NOW(),
    @empresa_id
);