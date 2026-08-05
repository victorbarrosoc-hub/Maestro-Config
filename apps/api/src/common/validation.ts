/**
 * Erro de validação em português, legível e no formato certo.
 *
 * O `ValidationPipe` do NestJS levanta `BadRequestException` com um **array**
 * de mensagens em inglês (`"name must be a string"`). Isso viola duas regras
 * do projeto ao mesmo tempo: o RFC 9457 exige `title` como texto, e a
 * identidade verbal proíbe expor jargão de biblioteca ao usuário.
 *
 * Aqui o array vira:
 *   - `title` e `detail` — frases exibíveis, em português
 *   - `errors` — lista por campo, para a interface destacar o que corrigir
 */

import { HttpStatus } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { ProblemException } from './problem.filter';

/**
 * Mensagem por restrição, para quando o DTO não trouxe uma própria.
 *
 * Convenção que sustenta a distinção: o `class-validator` sempre começa a
 * mensagem padrão com o nome do campo (`"name must be..."`). As mensagens
 * escritas nos DTOs nunca começam assim — então dá para saber qual é qual
 * sem depender de tradução de string.
 */
const POR_RESTRICAO: Record<string, string> = {
  isString: 'precisa ser um texto',
  isEmail: 'precisa ser um e-mail válido',
  isEnum: 'tem um valor que não existe',
  isUUID: 'precisa ser um identificador válido',
  isInt: 'precisa ser um número inteiro',
  isNumber: 'precisa ser um número',
  isBoolean: 'precisa ser sim ou não',
  isArray: 'precisa ser uma lista',
  isObject: 'precisa ser um objeto',
  isUrl: 'precisa ser um endereço válido',
  isDateString: 'precisa ser uma data válida',
  isNotEmpty: 'não pode ficar em branco',
  minLength: 'está curto demais',
  maxLength: 'está longo demais',
  min: 'está abaixo do mínimo',
  max: 'passou do máximo',
  arrayMinSize: 'precisa de pelo menos um item',
  whitelistValidation: 'não é aceito aqui',
};

export interface CampoInvalido {
  campo: string;
  mensagem: string;
  /** Códigos crus, para a interface decidir o próprio texto se quiser. */
  restricoes: string[];
}

/** Achata a árvore do class-validator, preservando o caminho do campo. */
function achatar(erros: ValidationError[], prefixo = ''): CampoInvalido[] {
  const saida: CampoInvalido[] = [];

  for (const erro of erros) {
    const campo = prefixo ? `${prefixo}.${erro.property}` : erro.property;

    if (erro.constraints) {
      const restricoes = Object.keys(erro.constraints);
      saida.push({ campo, mensagem: melhorMensagem(erro), restricoes });
    }

    if (erro.children?.length) {
      saida.push(...achatar(erro.children, campo));
    }
  }

  return saida;
}

/** A mensagem do DTO ganha; sem ela, a genérica em português. */
function melhorMensagem(erro: ValidationError): string {
  const entradas = Object.entries(erro.constraints ?? {});

  for (const [, texto] of entradas) {
    if (!texto.startsWith(`${erro.property} `)) return texto;
  }

  const [chave] = entradas[0] ?? [];
  const generica = chave ? POR_RESTRICAO[chave] : undefined;
  return `O campo "${erro.property}" ${generica ?? 'está inválido'}.`;
}

/**
 * Usada como `exceptionFactory` do `ValidationPipe`.
 *
 * Um campo errado vira uma frase direta. Vários viram a contagem + a primeira,
 * porque despejar oito mensagens numa tela não ajuda ninguém a corrigir a
 * primeira.
 */
export function problemaDeValidacao(erros: ValidationError[]): ProblemException {
  const campos = achatar(erros);
  const primeira = campos[0]?.mensagem ?? 'Confira os dados enviados.';

  const detail =
    campos.length > 1
      ? `${primeira} Há mais ${campos.length - 1} campo(s) para corrigir.`
      : primeira;

  return new ProblemException(HttpStatus.BAD_REQUEST, {
    type: 'https://api.maestro.app/errors/invalid-body',
    title: 'Confira os campos',
    detail,
    errors: campos,
  });
}
